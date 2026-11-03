import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyShareSessionToken } from '@/lib/auth';
import { isFolderWithinPermittedScope } from '@/lib/isolation';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionToken =
      req.headers.get('x-share-session') || searchParams.get('session');

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'جلسة العرض غير مصرح بها. الرجاء إدخال رمز الأمان أولاً.' },
        { status: 401 }
      );
    }

    const session = verifyShareSessionToken(sessionToken);
    if (!session || session.token !== params.token) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية جلسة الأمان. الرجاء إعادة إدخال رمز PIN.' },
        { status: 401 }
      );
    }

    const { workspaceId, permittedFolderId, allowDownload } = session;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    let rawRequestedFolderId = searchParams.get('folderId');
    if (rawRequestedFolderId === 'root' || rawRequestedFolderId === '') {
      rawRequestedFolderId = null;
    }

    // Determine effective target folder ID
    let targetFolderId: string | null = rawRequestedFolderId;

    if (permittedFolderId) {
      // Subfolder Isolation: default to permitted folder if root or nothing is requested
      if (!targetFolderId) {
        targetFolderId = permittedFolderId;
      }

      // Check strict isolation boundary
      const isAllowed = await isFolderWithinPermittedScope(
        targetFolderId,
        permittedFolderId,
        workspaceId
      );

      if (!isAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'وصول مرفوض: تم حظر محاولة الخروج عن نطاق المجلد المخصص.',
          },
          { status: 403 }
        );
      }
    }

    // Retrieve target folder details if not at workspace root
    let currentFolder = null;
    if (targetFolderId) {
      currentFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
      });
      if (!currentFolder || currentFolder.workspaceId !== workspaceId) {
        return NextResponse.json(
          { success: false, error: 'المجلد غير موجود' },
          { status: 404 }
        );
      }
    }

    // Build client breadcrumbs (strictly scoped to permitted boundary)
    const breadcrumbs: Array<{ id: string | null; name: string }> = [];

    if (permittedFolderId) {
      // Under Subfolder Isolation, the root is the permitted folder!
      const permittedFolder = await prisma.folder.findUnique({
        where: { id: permittedFolderId },
      });

      breadcrumbs.push({
        id: permittedFolderId,
        name: `${workspace.driveLetter} ${permittedFolder?.name || 'المجلد الرئيسي'}`,
      });

      // If we are deeper than permittedFolder, walk upwards until permittedFolder
      if (currentFolder && currentFolder.id !== permittedFolderId) {
        const intermediate: Array<{ id: string; name: string }> = [];
        let tempParentId = currentFolder.parentId;

        while (tempParentId && tempParentId !== permittedFolderId) {
          const parent = await prisma.folder.findUnique({
            where: { id: tempParentId },
            select: { id: true, name: true, parentId: true },
          });
          if (!parent) break;
          intermediate.unshift({ id: parent.id, name: parent.name });
          tempParentId = parent.parentId;
        }

        breadcrumbs.push(...intermediate);
        breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
      }
    } else {
      // Root Access: Breadcrumbs starts at workspace drive root
      breadcrumbs.push({
        id: null,
        name: `${workspace.name} (${workspace.driveLetter})`,
      });

      if (currentFolder) {
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
    }

    // Fetch child folders
    const folders = await prisma.folder.findMany({
      where: {
        workspaceId,
        parentId: targetFolderId,
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
        folderId: targetFolderId,
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
        name: workspace.name,
        clientName: workspace.clientName,
        driveLetter: workspace.driveLetter,
        color: workspace.color,
      },
      currentFolder,
      isRootLevel: permittedFolderId ? targetFolderId === permittedFolderId : targetFolderId === null,
      breadcrumbs,
      folders,
      files: formattedFiles,
      allowDownload,
    });
  } catch (error: any) {
    console.error('Client browse error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر استعراض الملفات' },
      { status: 500 }
    );
  }
}
