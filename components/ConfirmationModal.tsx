'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isDanger
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

          {itemName && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400">العنصر المحدد:</span>
              <span className="text-xs font-bold text-slate-200 truncate select-all font-mono" dir="ltr">
                {itemName}
              </span>
            </div>
          )}

          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              isDanger
                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`py-2.5 px-5 text-xs font-bold text-white rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 ${
                isDanger
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-950/40'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/40'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>جاري التنفيذ...</span>
                </>
              ) : (
                <>
                  {isDanger && <Trash2 size={14} />}
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
