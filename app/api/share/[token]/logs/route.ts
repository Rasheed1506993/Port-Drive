import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const adminToken = cookies().get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const session = verifyAdminToken(adminToken);
    if (!session) {
      return NextResponse.json({ success: false, error: 'جلسة مسؤول غير صالحة' }, { status: 401 });
    }

    const link = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: {
        workspace: {
          select: { name: true, clientName: true, driveLetter: true },
        },
        folder: {
          select: { name: true, path: true },
        },
        accessLogs: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'رابط المشاركة غير موجود' },
        { status: 404 }
      );
    }

    // Compute stats
    const totalViews = link.viewsCount;
    const successfulUnlocks = link.accessLogs.filter((l) => l.status === 'SUCCESS').length;
    const wrongPins = link.accessLogs.filter((l) => l.status === 'WRONG_PIN').length;
    const pageViews = link.accessLogs.filter((l) => l.status === 'VIEW' || l.status === 'OPENED').length;

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        token: link.token,
        title: link.title,
        pinCode: link.pinCode,
        allowDownload: link.allowDownload,
        expiresAt: link.expiresAt,
        viewsCount: link.viewsCount,
        createdAt: link.createdAt,
        workspaceName: link.workspace.name,
        clientName: link.workspace.clientName,
        driveLetter: link.workspace.driveLetter,
        folderName: link.folder?.name || null,
      },
      stats: {
        totalViews,
        successfulUnlocks,
        wrongPins,
        pageViews,
      },
      logs: link.accessLogs,
    });
  } catch (error: any) {
    console.error('Failed to get share link logs:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحميل سجل النشاط' },
      { status: 500 }
    );
  }
}
