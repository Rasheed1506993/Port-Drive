import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageDriver } from '@/lib/storage';
import { Readable } from 'stream';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.fileItem.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    const storage = getStorageDriver();

    // Check if S3 driver supports presigned redirect
    if (storage.name === 's3' && storage.getPresignedDownloadUrl) {
      try {
        const presignedUrl = await storage.getPresignedDownloadUrl(file.storageKey, 3600);
        return NextResponse.redirect(presignedUrl);
      } catch (err) {
        console.warn('Presigned URL failed, falling back to stream:', err);
      }
    }

    // Stream the file directly
    const result = await storage.getDownloadStream(file.storageKey);

    // Convert Node Readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        result.stream.on('data', (chunk) => controller.enqueue(chunk));
        result.stream.on('end', () => controller.close());
        result.stream.on('error', (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set('Content-Length', file.size.toString());
    const encodedName = encodeURIComponent(file.name);
    headers.set(
      'Content-Disposition',
      `inline; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
    );

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('File stream error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تنزيل الملف' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.fileItem.findUnique({
      where: { id: params.id },
      include: { workspace: true },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    // Delete from storage
    const storage = getStorageDriver();
    await storage.delete(file.storageKey);

    // Delete from DB
    await prisma.fileItem.delete({
      where: { id: params.id },
    });

    // Update workspace storage size
    const newUsed =
      file.workspace.usedStorageBytes > file.size
        ? file.workspace.usedStorageBytes - file.size
        : BigInt(0);

    await prisma.workspace.update({
      where: { id: file.workspaceId },
      data: { usedStorageBytes: newUsed },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الملف بنجاح',
    });
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر حذف الملف' },
      { status: 500 }
    );
  }
}
