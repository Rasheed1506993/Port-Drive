import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
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

    const formatted = workspaces.map((w) => ({
      ...w,
      storageQuotaBytes: w.storageQuotaBytes.toString(),
      usedStorageBytes: w.usedStorageBytes.toString(),
    }));

    return NextResponse.json({ success: true, workspaces: formatted });
  } catch (error: any) {
    console.error('Failed to fetch workspaces:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر جلب مساحات الأعمال' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      clientName,
      clientEmail,
      clientPhone,
      driveLetter = 'C:',
      color = 'blue',
      icon = 'hard-drive',
      description,
      storageQuotaGB = 10,
    } = body;

    if (!name || !clientName) {
      return NextResponse.json(
        { success: false, error: 'اسم المساحة واسم العميل مطلوبان' },
        { status: 400 }
      );
    }

    const quotaBytes = BigInt(storageQuotaGB) * BigInt(1024 * 1024 * 1024);

    const workspace = await prisma.workspace.create({
      data: {
        name,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        driveLetter: driveLetter.toUpperCase().endsWith(':') ? driveLetter.toUpperCase() : `${driveLetter.toUpperCase()}:`,
        color,
        icon,
        description: description || null,
        storageQuotaBytes: quotaBytes,
      },
    });

    await prisma.auditActivity.create({
      data: {
        workspaceId: workspace.id,
        action: 'WORKSPACE_CREATED',
        details: `تم إنشاء مساحة عمل جديدة (${workspace.name}) للعميل (${workspace.clientName}) بالقرص (${workspace.driveLetter})`,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: {
        ...workspace,
        storageQuotaBytes: workspace.storageQuotaBytes.toString(),
        usedStorageBytes: workspace.usedStorageBytes.toString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إنشاء مساحة العمل' },
      { status: 500 }
    );
  }
}
