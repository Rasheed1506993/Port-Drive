import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyShareSessionToken } from '@/lib/auth';
import { isFileWithinPermittedScope } from '@/lib/isolation';
import { getStorageDriver } from '@/lib/storage';

export async function GET(
  req: Request,
  { params }: { params: { token: string; fileId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionToken =
      req.headers.get('x-share-session') || searchParams.get('session');

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بتحميل الملف' },
        { status: 401 }
      );
    }

    const session = verifyShareSessionToken(sessionToken);
    if (!session || session.token !== params.token) {
      return NextResponse.json(
        { success: false, error: 'جلسة التحميل منتهية' },
        { status: 401 }
      );
    }

    const isPreview = searchParams.get('preview') === 'true';

    // If it's a download request (not preview), verify that download is permitted
    if (!isPreview && !session.allowDownload) {
      return NextResponse.json(
        { success: false, error: 'التحميل غير مسموح به لهذا الرابط' },
        { status: 403 }
      );
    }

    // Boundary check: file must be inside the permitted scope
    const isAllowed = await isFileWithinPermittedScope(
      params.fileId,
      session.permittedFolderId,
      session.workspaceId
    );

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'وصول مرفوض: الملف خارج النطاق المصرح به' },
        { status: 403 }
      );
    }

    const file = await prisma.fileItem.findUnique({
      where: { id: params.fileId },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    const storage = getStorageDriver();

    // Stream through Next.js proxy to preserve Content-Type, security and privacy
    const downloadStream = await storage.getDownloadStream(file.storageKey);

    const webStream = new ReadableStream({
      start(controller) {
        downloadStream.stream.on('data', (chunk) => controller.enqueue(chunk));
        downloadStream.stream.on('end', () => controller.close());
        downloadStream.stream.on('error', (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set('Content-Length', file.size.toString());
    const encodedName = encodeURIComponent(file.name);
    const dispositionType = isPreview ? 'inline' : 'attachment';
    headers.set(
      'Content-Disposition',
      `${dispositionType}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
    );

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('Share download error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تنزيل الملف' },
      { status: 500 }
    );
  }
}
