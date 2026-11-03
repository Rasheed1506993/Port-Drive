import { NextResponse } from 'next/server';
import { getStorageDriver } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const s3StartTime = Date.now();
    const currentDriver = getStorageDriver();
    const testResult = await currentDriver.testConnection();
    const s3LatencyMs = Date.now() - s3StartTime;

    // Test Database connection & latency
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStartTime;

    return NextResponse.json({
      success: true,
      activeDriver: currentDriver.name,
      statusMessage: testResult.message,
      isConfigured: currentDriver.isConfigured,
      s3Config: {
        isConfigured: true,
        endpoint: process.env.S3_ENDPOINT || 'https://s3.xpertsafe.com',
        region: process.env.S3_REGION || 'us-east-1',
        bucket: process.env.S3_BUCKET || 'drive-assets',
        latencyMs: s3LatencyMs,
        provider: 'MinIO Enterprise S3 Storage',
        ssl: true,
      },
      dbConfig: {
        isConnected: true,
        host: 'db.xpertsafe.com',
        port: 5433,
        database: 'client_drive_db',
        engine: 'PostgreSQL Relational Engine',
        latencyMs: dbLatencyMs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'تعذر فحص حالة التخزين وقاعدة البيانات',
      },
      { status: 500 }
    );
  }
}
