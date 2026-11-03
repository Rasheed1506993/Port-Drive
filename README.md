# منصة المحافظ الرقمية وإدارة التخزين السحابي (Cloud Portfolio Vault)

نظام سحابي متكامل يجمع بين **لوحة تحكم المسؤول (Admin Dashboard)** و**واجهة استعراض عامة للعملاء (Client & Portfolio Viewer)**، متصل بالكامل بقاعدة بيانات **PostgreSQL** الحقيقية ومزود التخزين السحابي **MinIO S3**.

---

## 🚀 بيانات الربط النشطة الحالية (Active Production Connections)

### 1. مزود التخزين السحابي (MinIO S3):
* **Endpoint:** `https://s3.xpertsafe.com`
* **Bucket Name:** `drive-assets`
* **Public Base URL:** `https://s3.xpertsafe.com/drive-assets`
* **Region:** `us-east-1`
* **Status:** متصل ونشط بالكامل (All files are uploaded & streamed from MinIO S3).

### 2. قاعدة البيانات (Remote PostgreSQL Database):
* **Host & Port:** `db.xpertsafe.com:5433`
* **Database Name:** `client_drive_db`
* **User:** `client_drive_user`
* **Status:** الجداول منشأة بالكامل عبر Prisma، وتم تأسيس المحفظة والشركات الست وروابط الـ PIN بنجاح.

---

## 🔗 روابط التجربة الحية الفورية

الخادم يعمل حالياً على: **`http://localhost:3000`**

| الواجهة / الرابط | المسار المباشر | رمز الأمان (PIN) | نطاق الوصول والصلاحية |
| :--- | :--- | :---: | :--- |
| **الصفحة الرئيسية** | [`http://localhost:3000`](http://localhost:3000) | — | بوابة المنصة واستعراض المعايير الأساسية |
| **لوحة تحكم المسؤول (Admin)** | [`http://localhost:3000/admin`](http://localhost:3000/admin) | — | إدارة العملاء، تعديل البيانات، الحذف، الرفع المتداخل، وروابط المشاركة |
| **رابط استعراض عميل (وصول كامل لـ 6 شركات)** | [`http://localhost:3000/share/client-all-companies`](http://localhost:3000/share/client-all-companies) | `123456` | **وصول شامل (Root Access)**: تصفح شركات المحفظة الست ومجلداتها في القرص `C:` |
| **رابط استعراض مقيد (Subfolder Isolation)** | [`http://localhost:3000/share/isolated-branding-assets`](http://localhost:3000/share/isolated-branding-assets) | `654321` | **عزل تام (Subfolder Isolated)**: مقيد بملفات الهوية البصرية لشركة تقنية السحاب فقط، مع منع الرجوع للأعلى |

---

## 🌟 المزايا والوظائف المنفذة في النظام

1. **إدارة العملاء ومساحات الأعمال (Client & Workspace CRUD)**:
   * **إنشاء مساحة أعمال جديدة (Create Workspace / Bucket)** للعميل مع تحديد اسمه، بريده، هاتفه، وحرف القرص التخزيني (`C:`, `D:`).
   * **تعديل بيانات العميل ومساحة العمل (Edit Client & Workspace)**: نافذة متكاملة لتحديث الاسم، بيانات الاتصال، تغيير حرف القرص، تعديل الحصة التخزينية (Quota GB)، وتغيير اللون والوصف.
   * **حذف العميل ومساحة العمل (Delete Client & Workspace)**: زر حذف مخصص مع نافذة تأكيد تحذيرية لحذف القرص بكافة مجلداته وملفاته من سحابة MinIO S3 وقاعدة بيانات PostgreSQL بشكل نهائي وإبطال روابطه.

2. **واجهة استعراض العميل (Client & Portfolio Viewer)**:
   * تصفح محفظة تضم 6 شركات لعميل واحد داخل مساحة عمل واحدة.
   * تجربة File Explorer UX لأجهزة سطح المكتب (Breadcrumbs, Search, Grid/List view, File Preview Modal, ZIP Download).

3. **لوحة التحكم والرفع المتداخل (Admin Upload & Explorer)**:
   * **تقييد نطاق الرفع (Upload Boundary Restriction)**: منع أي رفع خارج نطاق مساحة العمل والمجلد المحدد.
   * **الرفع الجماعي للمجلدات (Bulk & Nested Upload)**: دعم رفع مجلد كامل بهيكليته المتفرعة (4 إلى 5 مجلدات فرعية) دفعة واحدة عبر `webkitdirectory` أو السحب والإفلات.

4. **توليد الروابط ونظام الصلاحيات (Link Generation & Isolation)**:
   * **عزل المجلدات الفرعية (Subfolder Isolation)**: منع الزائر تماماً من التنقل للمجلدات الأعلى أو الشقيقة وحظر المسارات الأبوية.
   * **الحماية برمز أمان 6-Digit PIN**: تشفير `bcrypt` مع لوحة مفاتيح رقمية وجلسات مشفرة بـ `JWT`.
