import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const folderId = searchParams.get('folderId'); // null/empty string = root

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'معرّف مساحة العمل مطلوب' },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    const all = searchParams.get('all');
    if (all === 'true') {
      const allFolders = await prisma.folder.findMany({
        where: { workspaceId },
        orderBy: { path: 'asc' },
        include: {
          _count: {
            select: {
              children: true,
              files: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        folders: allFolders,
      });
    }

    let currentFolder = null;
    const breadcrumbs: Array<{ id: string | null; name: string }> = [
      { id: null, name: `${workspace.name} (${workspace.driveLetter})` },
    ];

    if (folderId && folderId !== 'root') {
      currentFolder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!currentFolder || currentFolder.workspaceId !== workspaceId) {
        return NextResponse.json(
          { success: false, error: 'المجلد غير موجود' },
          { status: 404 }
        );
      }

      // Build breadcrumbs by walking up parents
      const ancestors: Array<{ id: string; name: string }> = [];
      let tempParentId = currentFolder.parentId;

      while (tempParentId) {
        const parent = await prisma.folder.findUnique({
          where: { id: tempParentId },
          select: { id: true, name: true, parentId: true },
        });
        if (!parent) break;
        ancestors.unshift({ id: parent.id, name: parent.name });
        tempParentId = parent.parentId;
      }

      breadcrumbs.push(...ancestors);
      breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
    }

    // Fetch subfolders
    const subfolders = await prisma.folder.findMany({
      where: {
        workspaceId,
        parentId: currentFolder ? currentFolder.id : null,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    // Fetch files
    const files = await prisma.fileItem.findMany({
      where: {
        workspaceId,
        folderId: currentFolder ? currentFolder.id : null,
      },
      orderBy: { name: 'asc' },
    });

    const formattedFiles = files.map((f) => ({
      ...f,
      size: f.size.toString(),
    }));

    return NextResponse.json({
      success: true,
      workspace: {
        ...workspace,
        storageQuotaBytes: workspace.storageQuotaBytes.toString(),
        usedStorageBytes: workspace.usedStorageBytes.toString(),
      },
      currentFolder,
      breadcrumbs,
      folders: subfolders,
      files: formattedFiles,
    });
  } catch (error: any) {
    console.error('Failed to browse folders:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحميل محتويات المجلد' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, parentId = null, name, color } = body;

    if (!workspaceId || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'بيانات المجلد غير مكتملة' },
        { status: 400 }
      );
    }

    const cleanName = name.trim().replace(/[\\/:*?"<>|]/g, '-');

    // Check workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    // Determine path
    let folderPath = `/${cleanName}`;
    if (parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (parent) {
        folderPath = `${parent.path}/${cleanName}`;
      }
    }

    // Check duplicate
    const existing = await prisma.folder.findFirst({
      where: {
        workspaceId,
        parentId: parentId || null,
        name: cleanName,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'يوجد مجلد آخر يحمل نفس الاسم في هذا المسار' },
        { status: 409 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        workspaceId,
        parentId: parentId || null,
        name: cleanName,
        path: folderPath,
        color: color || null,
      },
    });

    await prisma.auditActivity.create({
      data: {
        workspaceId,
        action: 'FOLDER_CREATED',
        details: `تم إنشاء المجلد (${folder.name}) في المسار (${folder.path})`,
      },
    });

    return NextResponse.json({ success: true, folder });
  } catch (error: any) {
    console.error('Failed to create folder:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إنشاء المجلد' },
      { status: 500 }
    );
  }
}
