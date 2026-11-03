import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyShareSessionToken } from '@/lib/auth';
import { isFolderWithinPermittedScope } from '@/lib/isolation';
import { getStorageDriver } from '@/lib/storage';
import archiver from 'archiver';
import { PassThrough } from 'stream';

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
        { success: false, error: 'غير مصرح بتحميل المجلد' },
        { status: 401 }
      );
    }

    const session = verifyShareSessionToken(sessionToken);
    if (!session || session.token !== params.token) {
      return NextResponse.json(
        { success: false, error: 'جلسة التحميل غير صالحة' },
        { status: 401 }
      );
    }

    if (!session.allowDownload) {
      return NextResponse.json(
        { success: false, error: 'التحميل غير مسموح به لهذا الرابط' },
        { status: 403 }
      );
    }

    const requestedFolderId = searchParams.get('folderId') || session.permittedFolderId;

    if (session.permittedFolderId) {
      const isAllowed = await isFolderWithinPermittedScope(
        requestedFolderId,
        session.permittedFolderId,
        session.workspaceId
      );
      if (!isAllowed) {
        return NextResponse.json(
          { success: false, error: 'المجلد المطلوب خارج النطاق المصرح به' },
          { status: 403 }
        );
      }
    }

    // Collect all files under this folder
    const allFolderIds: (string | null)[] = requestedFolderId ? [requestedFolderId] : [null];
    let toProcess: string[] = requestedFolderId ? [requestedFolderId] : [];

    while (toProcess.length > 0) {
      const nextBatch = await prisma.folder.findMany({
        where: { parentId: { in: toProcess } },
        select: { id: true },
      });
      toProcess = nextBatch.map((f) => f.id);
      allFolderIds.push(...toProcess);
    }

    const files = await prisma.fileItem.findMany({
      where: {
        workspaceId: session.workspaceId,
        folderId: { in: allFolderIds as any },
      },
      include: { folder: true },
    });

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد ملفات في هذا المجلد لتحميلها' },
        { status: 404 }
      );
    }

    const storage = getStorageDriver();
    const archive = archiver('zip', { zlib: { level: 6 } });
    const passthrough = new PassThrough();

    // Pipe archive to passthrough
    archive.pipe(passthrough);

    // Append each file to zip
    (async () => {
      try {
        for (const f of files) {
          const download = await storage.getDownloadStream(f.storageKey);
          const zipPath = f.folder ? `${f.folder.name}/${f.name}` : f.name;
          archive.append(download.stream, { name: zipPath });
        }
        await archive.finalize();
      } catch (err) {
        console.error('Archive packing error:', err);
        archive.abort();
      }
    })();

    const webStream = new ReadableStream({
      start(controller) {
        passthrough.on('data', (chunk) => controller.enqueue(chunk));
        passthrough.on('end', () => controller.close());
        passthrough.on('error', (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    const zipName = encodeURIComponent(`portfolio_export_${Date.now()}.zip`);
    headers.set('Content-Disposition', `attachment; filename="${zipName}"`);

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('Zip stream error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إنشاء ملف الـ ZIP' },
      { status: 500 }
    );
  }
}
