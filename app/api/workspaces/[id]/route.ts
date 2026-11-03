import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageDriver } from '@/lib/storage';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            folders: true,
            files: true,
            shareLinks: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workspace: {
        ...workspace,
        storageQuotaBytes: workspace.storageQuotaBytes.toString(),
        usedStorageBytes: workspace.usedStorageBytes.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'تعذر جلب مساحة العمل' },
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
    const { name, clientName, clientEmail, clientPhone, driveLetter, color, description, storageQuotaGB } = body;

    const data: any = {};
    if (name) data.name = name;
    if (clientName) data.clientName = clientName;
    if (clientEmail !== undefined) data.clientEmail = clientEmail;
    if (clientPhone !== undefined) data.clientPhone = clientPhone;
    if (driveLetter) {
      data.driveLetter = driveLetter.toUpperCase().endsWith(':')
        ? driveLetter.toUpperCase()
        : `${driveLetter.toUpperCase()}:`;
    }
    if (color) data.color = color;
    if (description !== undefined) data.description = description;
    if (storageQuotaGB) {
      data.storageQuotaBytes = BigInt(storageQuotaGB) * BigInt(1024 * 1024 * 1024);
    }

    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      success: true,
      workspace: {
        ...updated,
        storageQuotaBytes: updated.storageQuotaBytes.toString(),
        usedStorageBytes: updated.usedStorageBytes.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'تعذر تحديث مساحة العمل' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    // Delete files from storage
    const storage = getStorageDriver();
    await storage.deletePrefix(`workspaces/${params.id}`);

    // Delete from database (cascade deletes folders, files, and links)
    await prisma.workspace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف مساحة العمل وجميع ملفاتها بنجاح',
    });
  } catch (error: any) {
    console.error('Failed to delete workspace:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر حذف مساحة العمل' },
      { status: 500 }
    );
  }
}
