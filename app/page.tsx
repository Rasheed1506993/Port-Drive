'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HardDrive,
  ShieldCheck,
  FolderTree,
  Lock,
  Cloud,
  ArrowLeft,
  KeyRound,
  ExternalLink,
  Layers,
  Database,
  CheckCircle2,
  Sparkles,
  Search,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = accessCode.trim();
    if (!cleanInput) {
      setError('الرجاء إدخال رمز المشاركة أو الرابط');
      return;
    }

    // Extract token if user pasted full URL
    let token = cleanInput;
    if (token.includes('/share/')) {
      const parts = token.split('/share/');
      token = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    token = token.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!token) {
      setError('رمز المشاركة المدخل غير صالح');
      return;
    }

    router.push(`/share/${token}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-gradient-to-b from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md">
              <Database size={20} />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-slate-100">Cloud Portfolio Vault</span>
              <span className="block text-[11px] text-slate-400">بوابة التخزين السحابي وحافظات الأعمال</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-sm"
            >
              <Lock size={13} className="text-blue-400" />
              <span>دخول الإدارة (Admin)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
            <Sparkles size={13} />
            <span>نظام الحافظات الرقمية والتخزين السحابي الآمن</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 leading-tight">
            استعراض ملفات وأعمال الشركات <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              بأعلى معايير الخصوصية والعزل الأمني
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            بوابة سحابية متقدمة تتيح للعملاء استعراض ملفات ومشاريع شركاتهم عبر واجهة تحاكي متصفحات الأقراص المحلية، مع تأمين كامل النطاق برمز أمان مخصص.
          </p>

          {/* Direct Share Link / Token Access Box */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
              <form onSubmit={handleAccessSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="ألصق رابط المشاركة أو معرّف المحفظة..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <KeyRound size={14} />
                  <span>فتح المحفظة</span>
                  <ChevronLeft size={14} />
                </button>
              </form>

              {error && (
                <p className="text-xs text-red-400 text-right px-3 pt-2">
                  {error}
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-3 text-center">
              يتم فتح المحفظة وإدخال رمز الأمان (PIN) المكون من 6 أرقام للوصول إلى الملفات
            </p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars Section */}
      <section className="px-6 py-16 border-t border-slate-800/60 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">المعايير الأمنية والتقنية للمنصة</h2>
          <p className="text-xs text-slate-400">
            بيئة تخزين سحابية مصممة خصيصاً لتلبية متطلبات الشركات والمؤسسات
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <HardDrive size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">استعراض الأقراص المحلية (File Explorer UX)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              واجهة تفاعلية تحاكي أنظمة تشغيل سطح المكتب، مع مسارات تتبع واضحة، وعرض شبكي وقائمة تفصيلية للملفات والمجلدات.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Lock size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">عزل المجلدات الفرعية (Subfolder Isolation)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تقييد صارم للمستخدم داخل المجلد المخصص له، مع منع تام للرجوع للمجلدات الأبوية أو استعراض المجلدات الشقيقة.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <KeyRound size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">الحماية برمز أمان مشفر (6-Digit PIN)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تشفير متقدم لكافة الروابط بواسطة خوارزمية bcrypt مع لوحة مفاتيح آمنة وحماية ضد محاولات التخمين المتكررة.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cloud size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">محرك التخزين السحابي (MinIO S3 Engine)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تكامل مباشر وموثوق مع خوادم التخزين السحابي وقواعد بيانات PostgreSQL مع سرعة دفق عالية ومعاينة فورية لكافة المستندات.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FolderTree size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">الرفع الجماعي المتداخل (Bulk Upload)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إمكانية رفع شجرة مجلدات كاملة تضم مستويات متعددة وملفات متنوعة دفعة واحدة مع الحفاظ التام على تسلسلها الهيكلي.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">تقييد نطاق الرفع والحصص (Boundary Control)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              مراقبة حدود التخزين ومساحات العمل ومنع أي محاولات رفع خارج النطاق المخصص لكل عميل.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>منصة المحافظ الرقمية وإدارة التخزين السحابي • Cloud Portfolio Vault © 2026</p>
      </footer>
    </div>
  );
}
