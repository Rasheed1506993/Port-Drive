'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  ShieldCheck,
  ShieldAlert,
  Eye,
  KeyRound,
  Download,
  Clock,
  Globe,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface LogItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  createdAt: string;
}

interface ShareLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  title?: string;
}

export const ShareLogsModal: React.FC<ShareLogsModalProps> = ({
  isOpen,
  onClose,
  token,
  title,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/share/${token}/logs`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'تعذر تحميل سجل النشاط');
      }
      setLinkData(data.link);
      setStats(data.stats);
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب السجلات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      fetchLogs();
    }
  }, [isOpen, token, fetchLogs]);

  if (!isOpen) return null;

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return 'جهاز غير معروف';
    let device = 'كمبيوتر';
    if (/mobile/i.test(ua)) device = 'هاتف ذكي';
    if (/tablet|ipad/i.test(ua)) device = 'جهاز لوحي';

    let browser = 'متصفح ويب';
    if (/chrome|crios/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';

    return `${browser} على ${device}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>تم فتح المحفظة بنجاح (PIN صحيح)</span>
          </span>
        );
      case 'WRONG_PIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
            <ShieldAlert size={12} className="text-rose-400" />
            <span>محاولة رمز PIN خاطئ</span>
          </span>
        );
      case 'VIEW':
      case 'OPENED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
            <Eye size={12} className="text-blue-400" />
            <span>زيارة واستعراض الرابط</span>
          </span>
        );
      case 'DOWNLOAD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
            <Download size={12} className="text-purple-400" />
            <span>تحميل ملف</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
            <Clock size={12} className="text-amber-400" />
            <span>محاولة دخول لرابط منتهي الصلاحية</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-purple-600/15 border border-purple-500/20 text-purple-400 flex-shrink-0">
              <History size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-100 truncate">
                سجل نشاط ومشاهدات الرابط
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {title || linkData?.title} • الرمز السري: <span className="font-mono text-blue-300 font-bold">{linkData?.pinCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchLogs}
              title="تحديث السجل"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الزيارات</span>
              <span className="text-xl font-bold text-slate-100 font-mono">
                {linkData?.viewsCount || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center">
              <span className="text-[11px] text-emerald-400 block mb-1">دخول ناجح (PIN)</span>
              <span className="text-xl font-bold text-emerald-300 font-mono">
                {stats?.successfulUnlocks || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-center">
              <span className="text-[11px] text-rose-400 block mb-1">محاولات PIN خاطئة</span>
              <span className="text-xl font-bold text-rose-300 font-mono">
                {stats?.wrongPins || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">صلاحية التنزيل</span>
              <span className="text-xs font-bold text-blue-400 block mt-1">
                {linkData?.allowDownload ? 'مسموح بالتحميل' : 'معاينة فقط'}
              </span>
            </div>
          </div>

          {/* Logs Timeline Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-400" />
              <span>التسلسل الزمني لعمليات الدخول والمحاولات ({logs.length})</span>
            </h4>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span className="text-xs">جاري تحميل سجل النشاط...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center border border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
                لم يتم تسجيل أي محاولات دخول أو زيارات لهذا الرابط حتى الآن.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/60">
                <table className="w-full text-right text-xs min-w-[550px]">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">حالة العملية</th>
                      <th className="py-2.5 px-4 font-semibold">عنوان IP</th>
                      <th className="py-2.5 px-4 font-semibold">الجهاز والمتصفح</th>
                      <th className="py-2.5 px-4 font-semibold text-left">التوقيت الدقيق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {parseUserAgent(log.userAgent)}
                        </td>
                        <td className="py-3 px-4 text-left text-slate-400 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
