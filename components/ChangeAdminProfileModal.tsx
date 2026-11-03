'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface ChangeAdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; name: string } | null;
  onUpdated: (user: { id: string; email: string; name: string }) => void;
}

export const ChangeAdminProfileModal: React.FC<ChangeAdminProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate passwords if user wants to change password
    if (newPassword.trim()) {
      if (!currentPassword) {
        setError('يرجى كتابة كلمة المرور الحالية لتأكيد التغيير');
        return;
      }
      if (newPassword.length < 6) {
        setError('يجب أن تكون كلمة المرور الجديدة مكونة من 6 خانات على الأقل');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currentPassword: currentPassword ? currentPassword : undefined,
          newPassword: newPassword ? newPassword : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'فشل تحديث البيانات');
      }

      setSuccessMsg('تم حفظ وتحديث بيانات المسؤول بنجاح!');
      onUpdated(data.user);

      // Auto close after 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/20 text-blue-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                إعدادات حساب المسؤول وكلمة المرور
              </h3>
              <p className="text-xs text-slate-400">
                تعديل البريد الإلكتروني وكلمة المرور في قاعدة البيانات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Admin Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم المسؤول
            </label>
            <div className="relative">
              <User size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              البريد الإلكتروني للدخول
            </label>
            <div className="relative">
              <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password Change Divider */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
              <Lock size={14} className="text-amber-400" />
              <span>تغيير كلمة المرور (اتركها فارغة إذا لم ترغب بتغييرها)</span>
            </h4>

            {/* Current Password */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="مطلوبة فقط في حال رغبت بتغيير كلمة المرور"
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 خانات على الأقل"
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
