'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  HardDrive,
  Folder,
  ArrowRight,
  AlertCircle,
  Delete,
} from 'lucide-react';

interface ShareInfo {
  title: string;
  workspaceName: string;
  clientName: string;
  driveLetter: string;
  color?: string;
  isSubfolderIsolated: boolean;
  folderName: string | null;
  requiresPin: boolean;
  allowDownload: boolean;
}

interface PinVerificationScreenProps {
  token: string;
  shareInfo: ShareInfo;
  onVerified: (sessionToken: string, updatedInfo: any) => void;
}

export const PinVerificationScreen: React.FC<PinVerificationScreenProps> = ({
  token,
  shareInfo,
  onVerified,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    const cleaned = val.replace(/\D/g, '');

    // Handle paste of full 6-digit code
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      triggerVerification(newDigits.join(''));
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify
    if (index === 5 && singleDigit) {
      const fullPin = newDigits.join('');
      if (fullPin.length === 6) {
        triggerVerification(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeypadPress = (num: string) => {
    setError(null);
    const emptyIndex = digits.findIndex((d) => d === '');
    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    setError(null);
    const reversedIndex = [...digits].reverse().findIndex((d) => d !== '');
    if (reversedIndex !== -1) {
      const actualIndex = 5 - reversedIndex;
      const newDigits = [...digits];
      newDigits[actualIndex] = '';
      setDigits(newDigits);
      inputRefs.current[actualIndex]?.focus();
    }
  };

  const triggerVerification = async (pinCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinCode }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'رمز الأمان غير صحيح');
      }

      onVerified(data.sessionToken, data.shareInfo);
    } catch (err: any) {
      setError(err.message || 'رمز الأمان (PIN) غير صحيح! حاول مجدداً.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-8 relative z-10 text-center flex flex-col items-center transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Security Icon badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 sm:mb-5 shadow-lg shadow-blue-500/5">
          <KeyRound size={28} />
        </div>

        {/* Link / Portfolio Title */}
        <h1 className="text-lg sm:text-xl font-bold text-slate-100 mb-1">{shareInfo.title}</h1>
        {shareInfo.clientName && (
          <p className="text-xs text-slate-400 mb-3 sm:mb-4">
            {shareInfo.clientName}
          </p>
        )}

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-5 sm:mb-6">
          <ShieldCheck size={13} className="text-blue-400" />
          <span>محفظة أعمال مشفرة وآمنة</span>
        </div>

        {/* Instruction */}
        <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 mb-5 sm:mb-6">
          <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-medium mb-3">
            <Lock size={14} />
            <span>أدخل رمز الأمان (PIN) المكون من 6 أرقام لفك التشفير</span>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-2" dir="ltr">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-400 flex items-center justify-center gap-1.5 animate-in fade-in">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Numeric On-Screen Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mb-6" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              disabled={loading}
              className="h-11 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-base font-semibold transition-colors active:scale-95 border border-slate-700/40"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            disabled={loading}
            className="h-11 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-base font-semibold transition-colors active:scale-95 border border-slate-700/40"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleKeypadBackspace}
            disabled={loading}
            className="h-11 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 border border-slate-700/40"
          >
            <Delete size={18} />
          </button>
        </div>

        {/* Security watermark */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>تشفير من طرف لآخر • منصة المحافظ السحابية الآمنة</span>
        </div>
      </div>
    </div>
  );
};
