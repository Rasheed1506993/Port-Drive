import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPin, createShareSessionToken } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const link = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: {
        workspace: {
          select: {
            name: true,
            clientName: true,
            driveLetter: true,
            color: true,
          },
        },
        folder: {
          select: {
            name: true,
            path: true,
          },
        },
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json(
        { success: false, error: 'رابط المشاركة غير صالح أو تم إيقافه' },
        { status: 404 }
      );
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية هذا الرابط' },
        { status: 410 }
      );
    }

    if (link.maxViews && link.viewsCount >= link.maxViews) {
      return NextResponse.json(
        { success: false, error: 'تم استنفاد الحد الأقصى للمشاهدات لهذا الرابط' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      shareInfo: {
        title: link.title,
        workspaceName: link.workspace.name,
        clientName: link.workspace.clientName,
        driveLetter: link.workspace.driveLetter,
        color: link.workspace.color,
        isSubfolderIsolated: Boolean(link.folderId),
        folderName: link.folder?.name || null,
        requiresPin: true,
        allowDownload: link.allowDownload,
      },
    });
  } catch (error: any) {
    console.error('Share link info error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر التحقق من رابط المشاركة' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || pin.toString().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'الرجاء إدخال رمز أمان مكون من 6 أرقام' },
        { status: 400 }
      );
    }

    const link = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: {
        workspace: true,
        folder: true,
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json(
        { success: false, error: 'رابط المشاركة غير صالح أو تم إيقافه' },
        { status: 404 }
      );
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية هذا الرابط' },
        { status: 410 }
      );
    }

    if (link.maxViews && link.viewsCount >= link.maxViews) {
      return NextResponse.json(
        { success: false, error: 'تم استنفاد الحد الأقصى للمشاهدات لهذا الرابط' },
        { status: 410 }
      );
    }

    // Verify PIN
    const isPinCorrect = await verifyPin(pin.toString(), link.pinHash);

    // Get IP address
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    if (!isPinCorrect) {
      await prisma.shareAccessLog.create({
        data: {
          shareLinkId: link.id,
          ipAddress,
          userAgent,
          status: 'WRONG_PIN',
        },
      });

      return NextResponse.json(
        { success: false, error: 'رمز الأمان (PIN) غير صحيح! يرجى المحاولة مرة أخرى.' },
        { status: 401 }
      );
    }

    // Update views count and last accessed
    await prisma.shareLink.update({
      where: { id: link.id },
      data: {
        viewsCount: link.viewsCount + 1,
        lastAccessedAt: new Date(),
      },
    });

    await prisma.shareAccessLog.create({
      data: {
        shareLinkId: link.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    // Generate verified scoped session token
    const sessionToken = createShareSessionToken({
      shareLinkId: link.id,
      token: link.token,
      workspaceId: link.workspaceId,
      permittedFolderId: link.folderId,
      allowDownload: link.allowDownload,
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      shareInfo: {
        title: link.title,
        workspaceName: link.workspace.name,
        clientName: link.workspace.clientName,
        driveLetter: link.workspace.driveLetter,
        color: link.workspace.color,
        isSubfolderIsolated: Boolean(link.folderId),
        permittedFolderId: link.folderId,
        folderName: link.folder?.name || null,
        allowDownload: link.allowDownload,
      },
    });
  } catch (error: any) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التحقق من رمز الأمان' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    await prisma.shareLink.delete({
      where: { token: params.token },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف رابط المشاركة بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'تعذر حذف رابط المشاركة' },
      { status: 500 }
    );
  }
}
