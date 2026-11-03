import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPin } from '@/lib/auth';
import { generateShareToken } from '@/lib/utils';

export async function GET() {
  try {
    const links = await prisma.shareLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            clientName: true,
            driveLetter: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        _count: {
          select: { accessLogs: true },
        },
      },
    });

    return NextResponse.json({ success: true, links });
  } catch (error: any) {
    console.error('Failed to list share links:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر جلب روابط المشاركة' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      workspaceId,
      folderId = null,
      title,
      pinCode,
      allowDownload = true,
      expiresAt = null,
      maxViews = null,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'معرّف مساحة العمل مطلوب' },
        { status: 400 }
      );
    }

    if (!pinCode || !/^\d{6}$/.test(pinCode.toString())) {
      return NextResponse.json(
        { success: false, error: 'يجب أن يتكون رمز الأمان من 6 أرقام تماماً' },
        { status: 400 }
      );
    }

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'مساحة العمل غير موجودة' },
        { status: 404 }
      );
    }

    // Verify target folder if specified
    let folder = null;
    if (folderId) {
      folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder || folder.workspaceId !== workspaceId) {
        return NextResponse.json(
          { success: false, error: 'المجلد المحدد غير موجود داخل هذه المساحة' },
          { status: 404 }
        );
      }
    }

    const pinStr = pinCode.toString();
    const pinHash = await hashPin(pinStr);
    const token = generateShareToken(12);

    const shareTitle =
      title && title.trim()
        ? title.trim()
        : folder
        ? `مشاركة مجلد ${folder.name} (${workspace.name})`
        : `مشاركة محفظة ${workspace.name} (وصول شامل)`;

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        workspaceId,
        folderId: folder ? folder.id : null,
        title: shareTitle,
        pinHash,
        pinCode: pinStr,
        allowDownload: Boolean(allowDownload),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxViews: maxViews ? parseInt(maxViews) : null,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            clientName: true,
            driveLetter: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    await prisma.auditActivity.create({
      data: {
        workspaceId,
        action: 'SHARE_LINK_CREATED',
        details: `تم إنشاء رابط مشاركة محمي برمز PIN للمجلد (${folder ? folder.name : 'القرص بالكامل'})`,
      },
    });

    return NextResponse.json({
      success: true,
      link: shareLink,
      shareUrl: `/share/${shareLink.token}`,
    });
  } catch (error: any) {
    console.error('Failed to create share link:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إنشاء رابط المشاركة' },
      { status: 500 }
    );
  }
}
