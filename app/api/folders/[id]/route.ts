import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageDriver } from '@/lib/storage';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
      include: {
        workspace: true,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'المجلد غير موجود' },
        { status: 404 }
      );
    }

    // Collect all descendant folder IDs to delete associated files
    const allFolderIds: string[] = [folder.id];
    let toProcess: string[] = [folder.id];

    while (toProcess.length > 0) {
      const nextBatch = await prisma.folder.findMany({
        where: { parentId: { in: toProcess } },
        select: { id: true },
      });
      toProcess = nextBatch.map((f) => f.id);
      allFolderIds.push(...toProcess);
    }

    // Find all files in these folders
    const files = await prisma.fileItem.findMany({
      where: { folderId: { in: allFolderIds } },
    });

    const storage = getStorageDriver();
    let reclaimedBytes = BigInt(0);

    for (const f of files) {
      await storage.delete(f.storageKey);
      reclaimedBytes += f.size;
    }

    // Delete folder from database (cascade deletes subfolders and files)
    await prisma.folder.delete({
      where: { id: folder.id },
    });

    // Update workspace storage size
    const newUsed =
      folder.workspace.usedStorageBytes > reclaimedBytes
        ? folder.workspace.usedStorageBytes - reclaimedBytes
        : BigInt(0);

    await prisma.workspace.update({
      where: { id: folder.workspaceId },
      data: { usedStorageBytes: newUsed },
    });

    await prisma.auditActivity.create({
      data: {
        workspaceId: folder.workspaceId,
        action: 'FOLDER_DELETED',
        details: `تم حذف المجلد (${folder.name}) ومحتوياته بالكامل`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المجلد وجميع محتوياته بنجاح',
    });
  } catch (error: any) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر حذف المجلد' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, color } = body;

    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'المجلد غير موجود' },
        { status: 404 }
      );
    }

    const data: any = {};
    if (name && name.trim()) {
      data.name = name.trim().replace(/[\\/:*?"<>|]/g, '-');
      // Update path
      const pathParts = folder.path.split('/');
      pathParts[pathParts.length - 1] = data.name;
      data.path = pathParts.join('/');
    }
    if (color !== undefined) {
      data.color = color;
    }

    const updated = await prisma.folder.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, folder: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'تعذر تحديث المجلد' },
      { status: 500 }
    );
  }
}
