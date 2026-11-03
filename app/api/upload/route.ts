import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageDriver } from '@/lib/storage';
import { sanitizePath } from '@/lib/utils';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const workspaceId = formData.get('workspaceId') as string;
    const targetFolderId = (formData.get('targetFolderId') as string) || null;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'معرّف مساحة العمل مطلوب' },
        { status: 400 }
      );
    }

    // 1. Boundary Check: Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة. تم منع الرفع خارج النطاق.' },
        { status: 404 }
      );
    }

    // 2. Boundary Check: If targetFolderId is specified, ensure it belongs to this workspace
    let baseTargetFolder: { id: string; path: string; workspaceId: string } | null = null;
    if (targetFolderId && targetFolderId !== 'root') {
      baseTargetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
      });

      if (!baseTargetFolder || baseTargetFolder.workspaceId !== workspaceId) {
        return NextResponse.json(
          {
            success: false,
            error: 'محاولة رفع خارج نطاق مساحة العمل المحددة! تم إيقاف العملية لأسباب أمنية.',
          },
          { status: 403 }
        );
      }
    }

    // Extract files and relative paths
    const files = formData.getAll('files') as File[];
    const paths = formData.getAll('paths') as string[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم إرسال أي ملفات للرفع' },
        { status: 400 }
      );
    }

    // 3. Storage Quota Check
    const totalNewBytes = files.reduce((acc, f) => acc + BigInt(f.size), BigInt(0));
    if (workspace.usedStorageBytes + totalNewBytes > workspace.storageQuotaBytes) {
      return NextResponse.json(
        {
          success: false,
          error: 'تم تجاوز الحد الأقصى للمساحة التخزينية المخصصة لهذا العميل.',
        },
        { status: 413 }
      );
    }

    const storage = getStorageDriver();
    const uploadedFiles: any[] = [];
    let uploadedBytes = BigInt(0);

    // Cache of created/resolved folders during this batch to minimize DB roundtrips
    // Map key: `${parentId || 'root'}:${folderName}` => folderId
    const folderCache = new Map<string, string>();

    // Helper to resolve or create a nested folder hierarchy
    const resolveNestedFolder = async (
      baseParentId: string | null,
      folderNames: string[]
    ): Promise<string | null> => {
      let currentParentId = baseParentId;
      let currentPath = baseTargetFolder ? baseTargetFolder.path : '';

      for (const rawName of folderNames) {
        const cleanName = rawName.trim().replace(/[\\/:*?"<>|]/g, '-');
        if (!cleanName) continue;

        const cacheKey = `${currentParentId || 'root'}:${cleanName}`;
        if (folderCache.has(cacheKey)) {
          currentParentId = folderCache.get(cacheKey)!;
          currentPath = `${currentPath}/${cleanName}`;
          continue;
        }

        // Search DB for folder
        let existingFolder = await prisma.folder.findFirst({
          where: {
            workspaceId,
            parentId: currentParentId,
            name: cleanName,
          },
        });

        if (!existingFolder) {
          const newPath = `${currentPath}/${cleanName}`;
          existingFolder = await prisma.folder.create({
            data: {
              workspaceId,
              parentId: currentParentId,
              name: cleanName,
              path: newPath,
            },
          });
        }

        folderCache.set(cacheKey, existingFolder.id);
        currentParentId = existingFolder.id;
        currentPath = existingFolder.path;
      }

      return currentParentId;
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = paths[i] ? sanitizePath(paths[i]) : file.name;

      // Extract directory segments and file name
      const pathSegments = relPath.split('/').filter(Boolean);
      const fileName = pathSegments.pop() || file.name;
      const cleanFileName = fileName.replace(/[\\/:*?"<>|]/g, '-');

      // Resolve destination folder ID in database
      const destinationFolderId = await resolveNestedFolder(
        baseTargetFolder ? baseTargetFolder.id : null,
        pathSegments
      );

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Unique storage key (prevent collisions)
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const safeRelativePath = pathSegments.join('/');
      const storageKey = `workspaces/${workspaceId}/${safeRelativePath ? safeRelativePath + '/' : ''}${uniqueSuffix}-${cleanFileName}`.replace(
        /\/+/g,
        '/'
      );

      const mimeType = file.type || 'application/octet-stream';
      const ext = path.extname(cleanFileName).replace('.', '').toLowerCase();

      // Upload via active storage driver (S3 / Local)
      const uploadResult = await storage.upload(storageKey, buffer, mimeType);

      // Create FileItem record in DB
      const fileRecord = await prisma.fileItem.create({
        data: {
          workspaceId,
          folderId: destinationFolderId,
          name: cleanFileName,
          originalName: file.name,
          storageKey: uploadResult.key,
          size: BigInt(file.size),
          mimeType,
          extension: ext,
          storageDriver: uploadResult.driver,
        },
      });

      uploadedBytes += fileRecord.size;
      uploadedFiles.push({
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size.toString(),
        mimeType: fileRecord.mimeType,
      });
    }

    // Update workspace storage used
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        usedStorageBytes: workspace.usedStorageBytes + uploadedBytes,
      },
    });

    await prisma.auditActivity.create({
      data: {
        workspaceId,
        action: 'FILES_UPLOADED',
        details: `تم رفع ${uploadedFiles.length} ملفات بهيكلية متداخلة بنجاح`,
      },
    });

    return NextResponse.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      message: `تم رفع ${uploadedFiles.length} ملف بنجاح مع الحفاظ على الهيكلية الشجرية`,
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { success: false, error: `فشل في رفع الملفات: ${error.message || 'خطأ غير متوقع'}` },
      { status: 500 }
    );
  }
}
