const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env manually if needed
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        val = val.replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const prisma = new PrismaClient();

const s3Endpoint = process.env.S3_ENDPOINT;
const s3Region = process.env.S3_REGION || 'us-east-1';
const s3Bucket = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET || 'drive-assets';
const s3AccessKey = process.env.S3_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID;
const s3SecretKey = process.env.S3_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY;
const isS3Enabled = Boolean(s3AccessKey && s3SecretKey);

const s3Client = isS3Enabled
  ? new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      forcePathStyle: true,
    })
  : null;

async function hashPin(pin) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

async function main() {
  console.log('🌱 Starting remote PostgreSQL database & S3 seed...');

  // Ensure local uploads directory exists as well
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Clear existing demo data
  await prisma.shareAccessLog.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.fileItem.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.auditActivity.deleteMany();

  // Helper to create sample file on S3 and in database
  async function createSampleFile(workspaceId, folderId, relativePath, fileName, content, mimeType) {
    const storageKey = `workspaces/${workspaceId}/${relativePath}/${fileName}`.replace(/\/+/g, '/');
    const buffer = Buffer.from(content);

    // Save locally as backup
    const localDiskPath = path.resolve(uploadsDir, storageKey);
    const dir = path.dirname(localDiskPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localDiskPath, buffer);

    // Upload to MinIO S3
    if (s3Client) {
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: s3Bucket,
            Key: storageKey,
            Body: buffer,
            ContentType: mimeType,
          })
        );
      } catch (err) {
        console.warn(`S3 upload warning for ${fileName}:`, err.message);
      }
    }

    const ext = path.extname(fileName).replace('.', '').toLowerCase();

    return await prisma.fileItem.create({
      data: {
        workspaceId,
        folderId,
        name: fileName,
        originalName: fileName,
        storageKey,
        size: BigInt(buffer.length),
        mimeType,
        extension: ext,
        storageDriver: s3Client ? 's3' : 'local',
      },
    });
  }

  // 1. Create Master Client Workspace (C: Drive)
  const workspace1 = await prisma.workspace.create({
    data: {
      name: 'محفظة مجموعة الرواد الاستثمارية',
      clientName: 'مجموعة الرواد القابضة - مازن الغامدي',
      clientEmail: 'client@alrowad-holding.com',
      clientPhone: '+966 50 123 4567',
      driveLetter: 'C:',
      color: 'blue',
      icon: 'hard-drive',
      description: 'المحفظة السحابية الشاملة لشركات المجموعة الست وفروعها الاستثمارية على سحابة MinIO S3 وقاعدة بيانات PostgreSQL',
      storageQuotaBytes: BigInt(50 * 1024 * 1024 * 1024), // 50 GB
    },
  });

  console.log(`✅ Created Workspace in PostgreSQL: ${workspace1.name} [${workspace1.driveLetter}]`);

  // 2. Create the 6 Company Folders as required in Master Prompt (عرض 6 شركات لعميل واحد)
  const companies = [
    {
      name: '1. شركة تقنية السحاب المتقدمة',
      path: '/1. شركة تقنية السحاب المتقدمة',
      color: 'blue',
      subfolders: [
        { name: 'العلامة التجارية والهوية', files: ['Brand_Guidelines_v2.pdf', 'Logo_Master_Vector.svg', 'Color_Palette.json'] },
        { name: 'العروض التقديمية والتقنية', files: ['Cloud_Architecture_2025.pdf', 'Investor_Pitch_Deck.pptx'] },
        { name: 'العقود والاتفاقيات', files: ['SLA_Agreement_2025.pdf', 'Non_Disclosure_Agreement.docx'] },
      ],
    },
    {
      name: '2. شركة مساكن نجد العقارية',
      path: '/2. شركة مساكن نجد العقارية',
      color: 'emerald',
      subfolders: [
        { name: 'مخططات المشاريع الهندسية', files: ['Tower_A_Elevation.pdf', 'Floor_Plan_Level_12.dwg'] },
        { name: 'عقود الاستثمار العقاري', files: ['Riyadh_North_Contract.pdf'] },
        { name: 'كتيبات التسويق والمبيعات', files: ['Brochure_Luxury_Villas.pdf', 'Price_List_Q4.xlsx'] },
      ],
    },
    {
      name: '3. شركة أفق للدعاية والإعلام',
      path: '/3. شركة أفق للدعاية والإعلام',
      color: 'purple',
      subfolders: [
        { name: 'الحملات الإعلانية 2025', files: ['Campaign_Brief_Ramadan.docx', 'Budget_Allocation.xlsx'] },
        { name: 'التصاميم والمطبوعات', files: ['Billboard_Final_Print.pdf', 'Social_Media_Templates.zip'] },
        { name: 'معرض الفيديو والمونتاج', files: ['Promo_Video_Storyline.pdf'] },
      ],
    },
    {
      name: '4. مصانع الخليج للصناعات الغذائية',
      path: '/4. مصانع الخليج للصناعات الغذائية',
      color: 'amber',
      subfolders: [
        { name: 'شهادات الجودة والسلامة', files: ['ISO_22000_Certificate.pdf', 'HACCP_Audit_Report.pdf'] },
        { name: 'قوائم المنتجات والمواصفات', files: ['Product_Catalog_2025.pdf', 'Nutritional_Facts.xlsx'] },
      ],
    },
    {
      name: '5. شركة لوجستيك النقل السريع',
      path: '/5. شركة لوجستيك النقل السريع',
      color: 'indigo',
      subfolders: [
        { name: 'تراخيص الأسطول والمستودعات', files: ['Fleet_Permits_KSA.pdf'] },
        { name: 'تقارير الأداء وتتبع الشحنات', files: ['Monthly_Operations_KPI.xlsx'] },
      ],
    },
    {
      name: '6. كابيتال المالية للاستشارات',
      path: '/6. كابيتال المالية للاستشارات',
      color: 'rose',
      subfolders: [
        { name: 'القوائم والتقارير المالية المدققة', files: ['Audited_Financials_2024.pdf', 'Cash_Flow_Forecast.xlsx'] },
        { name: 'دراسات الجدوى الاقتصادية', files: ['Feasibility_Study_Fintech.pdf'] },
      ],
    },
  ];

  let totalFilesCount = 0;
  let totalBytes = BigInt(0);
  let isolatedTargetFolderId = null;

  for (const comp of companies) {
    const parentFolder = await prisma.folder.create({
      data: {
        workspaceId: workspace1.id,
        name: comp.name,
        path: comp.path,
        color: comp.color,
      },
    });

    for (const sub of comp.subfolders) {
      const subPath = `${comp.path}/${sub.name}`;
      const subFolder = await prisma.folder.create({
        data: {
          workspaceId: workspace1.id,
          parentId: parentFolder.id,
          name: sub.name,
          path: subPath,
          color: comp.color,
        },
      });

      // Save this subfolder for subfolder isolation demonstration
      if (comp.name.includes('تقنية السحاب') && sub.name.includes('العلامة التجارية')) {
        isolatedTargetFolderId = subFolder.id;
      }

      for (const fileName of sub.files) {
        let content = '';
        let mimeType = 'text/plain';

        if (fileName.endsWith('.pdf')) {
          content = `%PDF-1.4 sample document for ${fileName} in ${comp.name} - ${sub.name}`;
          mimeType = 'application/pdf';
        } else if (fileName.endsWith('.json')) {
          content = JSON.stringify({ company: comp.name, theme: 'corporate', primaryColor: '#0c8beb' }, null, 2);
          mimeType = 'application/json';
        } else if (fileName.endsWith('.svg')) {
          content = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#0c8beb"/><text x="50%" y="50%" fill="#fff" dominant-baseline="middle" text-anchor="middle" font-size="20">${fileName}</text></svg>`;
          mimeType = 'image/svg+xml';
        } else if (fileName.endsWith('.xlsx')) {
          content = `Dummy spreadsheet data for ${fileName} - Q1, Q2, Q3, Q4 financial breakdown`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.pptx')) {
          content = `Office document content placeholder for ${fileName}`;
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else {
          content = `Archive/data file content for ${fileName}`;
          mimeType = 'application/octet-stream';
        }

        const fileRecord = await createSampleFile(
          workspace1.id,
          subFolder.id,
          subPath,
          fileName,
          content,
          mimeType
        );
        totalFilesCount++;
        totalBytes += fileRecord.size;
      }
    }
  }

  // Update workspace storage size
  await prisma.workspace.update({
    where: { id: workspace1.id },
    data: { usedStorageBytes: totalBytes },
  });

  // 3. Create Share Links with 6-Digit PIN
  const pin1 = '123456';
  const pinHash1 = await hashPin(pin1);

  // Link 1: ROOT ACCESS (الوصول الكامل لكامل محفظة الشركات)
  const rootShareLink = await prisma.shareLink.create({
    data: {
      token: 'client-all-companies',
      workspaceId: workspace1.id,
      folderId: null, // ROOT ACCESS
      title: 'رابط استعراض كافة شركات المحفظة الاستثمارية (وصول كامل)',
      pinHash: pinHash1,
      pinCode: pin1,
      allowDownload: true,
      allowSubfolderNavigation: true,
      viewsCount: 0,
    },
  });

  // Link 2: SUBFOLDER ISOLATION (وصول مقيد لمجلد واحد فقط ومنع الرجوع للأعلى)
  const pin2 = '654321';
  const pinHash2 = await hashPin(pin2);
  const isolatedShareLink = await prisma.shareLink.create({
    data: {
      token: 'isolated-branding-assets',
      workspaceId: workspace1.id,
      folderId: isolatedTargetFolderId, // SUBFOLDER ISOLATION
      title: 'رابط مقيد: ملفات الهوية البصرية لشركة تقنية السحاب فقط (Subfolder Isolated)',
      pinHash: pinHash2,
      pinCode: pin2,
      allowDownload: true,
      allowSubfolderNavigation: true,
      viewsCount: 0,
    },
  });

  // Create audit activity
  await prisma.auditActivity.create({
    data: {
      workspaceId: workspace1.id,
      action: 'SYSTEM_INITIALIZED',
      details: 'تم تأسيس مساحة العمل الافتراضية على PostgreSQL و MinIO S3 وهيكلية الشركات الست',
    },
  });

  console.log(`\n🎉 Remote PostgreSQL Seed & MinIO S3 Upload completed successfully!`);
  console.log(`📁 Total Folders created across 6 companies in PostgreSQL`);
  console.log(`📄 Total Files: ${totalFilesCount} (synced to MinIO S3 bucket: ${s3Bucket})`);
  console.log(`🔗 Root Share Link: /share/${rootShareLink.token} (PIN: ${pin1})`);
  console.log(`🔒 Isolated Share Link: /share/${isolatedShareLink.token} (PIN: ${pin2})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
