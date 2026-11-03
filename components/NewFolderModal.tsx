'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Folder } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  parentId: string | null;
  parentPathName: string;
  onCreated: () => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  parentId,
  parentPathName,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          parentId,
          name: name.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'تعذر إنشاء المجلد');
      }

      setName('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء المجلد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                إنشاء مجلد جديد
              </h3>
              <p className="text-xs text-slate-400">
                داخل: {parentPathName || 'المجلد الرئيسي'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم المجلد الجديد
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الهوية البصرية 2025"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="py-2.5 px-6 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <FolderPlus size={14} />
              <span>{loading ? 'جاري الإنشاء...' : 'إنشاء المجلد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
