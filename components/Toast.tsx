'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs ${
          type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            : type === 'error'
            ? 'bg-red-950/90 border-red-500/40 text-red-200'
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
          {type === 'error' && <AlertCircle size={18} className="text-red-400 flex-shrink-0" />}
          {type === 'info' && <Info size={18} className="text-blue-400 flex-shrink-0" />}
          <span className="font-semibold leading-relaxed">{message}</span>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
