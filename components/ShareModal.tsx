'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Lock,
  ExternalLink,
  Folder,
  HardDrive,
  RefreshCw,
  Download,
  Eye,
  Users,
  ChevronDown,
} from 'lucide-react';
import { generate6DigitPin } from '@/lib/utils';

export interface WorkspaceOption {
  id: string;
  name: string;
  clientName?: string | null;
  driveLetter: string;
  color?: string;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces?: WorkspaceOption[];
  initialWorkspaceId?: string;
  initialFolderId?: string | null;
  initialFolderName?: string;
  onSuccess?: () => void;
  // Backward compatibility props
  workspaceId?: string;
  folderId?: string | null;
  folderName?: string;
  workspaceName?: string;
  driveLetter?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  workspaces = [],
  initialWorkspaceId,
  initialFolderId,
  initialFolderName,
  onSuccess,
  workspaceId: legacyWorkspaceId,
  folderId: legacyFolderId,
  folderName: legacyFolderName,
  workspaceName: legacyWorkspaceName,
  driveLetter: legacyDriveLetter,
}) => {
  const [workspaceList, setWorkspaceList] = useState<WorkspaceOption[]>(workspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    initialWorkspaceId || legacyWorkspaceId || (workspaces[0]?.id ?? '')
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId !== undefined ? (initialFolderId || '') : (legacyFolderId || '')
  );
  const [folderList, setFolderList] = useState<
    Array<{
      id: string;
      name: string;
      path: string;
      _count?: { files: number; children: number };
    }>
  >([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const [title, setTitle] = useState('');
  const [isTitleManual, setIsTitleManual] = useState(false);
  const [pinCode, setPinCode] = useState(() => generate6DigitPin());
  const [allowDownload, setAllowDownload] = useState(true);
  const [expiryType, setExpiryType] = useState<'never' | '1' | '3' | '7' | '30' | 'custom'>('never');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [generatedLink, setGeneratedLink] = useState<{
    token: string;
    pinCode: string;
    title: string;
    url: string;
    workspaceLabel: string;
    folderLabel: string | null;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Sync workspace list from props or fetch if missing
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      setWorkspaceList(workspaces);
      if (!selectedWorkspaceId || !workspaces.some((w) => w.id === selectedWorkspaceId)) {
        const nextId = initialWorkspaceId || legacyWorkspaceId || workspaces[0].id;
        setSelectedWorkspaceId(nextId);
      }
    } else {
      fetch('/api/workspaces')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.workspaces)) {
            setWorkspaceList(data.workspaces);
            if (!selectedWorkspaceId && data.workspaces.length > 0) {
              const nextId = initialWorkspaceId || legacyWorkspaceId || data.workspaces[0].id;
              setSelectedWorkspaceId(nextId);
            }
          }
        })
        .catch((err) => console.error('Failed to fetch workspaces:', err));
    }
  }, [isOpen, workspaces]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      const initWs = initialWorkspaceId || legacyWorkspaceId || (workspaces[0]?.id ?? '');
      setSelectedWorkspaceId(initWs);
      const initFld = initialFolderId !== undefined ? (initialFolderId || '') : (legacyFolderId || '');
      setSelectedFolderId(initFld);
      setPinCode(generate6DigitPin());
      setGeneratedLink(null);
      setError(null);
      setIsTitleManual(false);
    }
  }, [isOpen, initialWorkspaceId, legacyWorkspaceId, initialFolderId, legacyFolderId]);

  // Load folders for selected workspace
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setFolderList([]);
      return;
    }
    let active = true;
    setLoadingFolders(true);

    fetch(`/api/folders?workspaceId=${selectedWorkspaceId}&all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.folders)) {
          setFolderList(data.folders);
        }
      })
      .catch((err) => console.error('Failed to load folders:', err))
      .finally(() => {
        if (active) setLoadingFolders(false);
      });

    return () => {
      active = false;
    };
  }, [selectedWorkspaceId]);

  // Dynamic automatic title updating unless user edited manually
  useEffect(() => {
    if (isTitleManual) return;

    const currentWs = workspaceList.find((w) => w.id === selectedWorkspaceId);
    const clientName = currentWs?.clientName;
    const wsName = currentWs?.name || legacyWorkspaceName || '';
    const clientLabel = clientName ? `${clientName} (${wsName})` : wsName;

    if (selectedFolderId) {
      const f = folderList.find((item) => item.id === selectedFolderId);
      const fName = f?.name || initialFolderName || legacyFolderName || '';
      if (fName) {
        setTitle(clientLabel ? `مشاركة مجلد: ${fName} — ${clientLabel}` : `مشاركة مجلد: ${fName}`);
      } else {
        setTitle(clientLabel ? `مشاركة محفظة: ${clientLabel}` : 'رابط مشاركة مجلد');
      }
    } else {
      setTitle(clientLabel ? `مشاركة محفظة: ${clientLabel}` : 'رابط مشاركة محفظة جديدة');
    }
  }, [selectedWorkspaceId, selectedFolderId, workspaceList, folderList, isTitleManual]);

  if (!isOpen) return null;

  const handleGenerateRandomPin = () => {
    setPinCode(generate6DigitPin());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWorkspaceId) {
      setError('يرجى تحديد العميل / مساحة العمل المستهدفة');
      return;
    }

    if (!pinCode || pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      setError('يجب أن يتكون رمز الأمان من 6 أرقام تماماً');
      return;
    }

    setLoading(true);

    try {
      let expiresAt: string | null = null;
      if (expiryType === 'custom') {
        if (!customExpiryDate) {
          setError('يرجى تحديد تاريخ ووقت انتهاء الصلاحية المخصص');
          setLoading(false);
          return;
        }
        expiresAt = new Date(customExpiryDate).toISOString();
      } else if (expiryType !== 'never') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiryType));
        expiresAt = d.toISOString();
      }

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          folderId: selectedFolderId || null,
          title: title.trim(),
          pinCode,
          allowDownload,
          expiresAt,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'تعذر إنشاء الرابط');
      }

      const fullUrl = `${window.location.origin}/share/${data.link.token}`;
      const currentWs = workspaceList.find((w) => w.id === selectedWorkspaceId);
      const currentFolder = folderList.find((f) => f.id === selectedFolderId);

      setGeneratedLink({
        token: data.link.token,
        pinCode: data.link.pinCode,
        title: data.link.title,
        url: fullUrl,
        workspaceLabel: currentWs
          ? `${currentWs.clientName ? `${currentWs.clientName} - ` : ''}${currentWs.name} (${currentWs.driveLetter})`
          : (legacyWorkspaceName || ''),
        folderLabel: currentFolder ? currentFolder.name : null,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء رابط المشاركة');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'pin') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {generatedLink ? 'تم إنشاء رابط المشاركة بنجاح' : 'إنشاء رابط مشاركة آمن برمز PIN'}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedFolderId
                  ? 'نظام العزل المقيد للمجلد (Subfolder Isolation)'
                  : 'وصول شامل لكامل محفظة العميل (Root Access)'}
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

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {generatedLink ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-sm">
                <ShieldCheck size={22} className="flex-shrink-0" />
                <span>
                  الرابط جاهز الآن ومحمي برمز الأمان. لا يمكن لأي زائر استعراض الملفات إلا بعد إدخال الرمز السري المكون من 6 أرقام.
                </span>
              </div>

              {/* Scope Summary Badge */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">العميل والمحفظة:</span>
                  <span className="font-semibold text-slate-200">{generatedLink.workspaceLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">نطاق الوصول الممنوح:</span>
                  <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                    {generatedLink.folderLabel ? <Folder size={14} /> : <HardDrive size={14} />}
                    {generatedLink.folderLabel
                      ? `المجلد: ${generatedLink.folderLabel} (مع حظر الرجوع للأعلى)`
                      : 'كامل مساحة العمل (وصول شامل)'}
                  </span>
                </div>
              </div>

              {/* Share Link Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">رابط المشاركة</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink.url}
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedLink.url, 'link')}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>

              {/* PIN Code Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  رمز الأمان السري (6-Digit PIN)
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <KeyRound size={18} className="text-blue-400" />
                    <div className="flex gap-1.5 tracking-widest font-mono text-xl font-bold text-blue-300" dir="ltr">
                      {generatedLink.pinCode.split('').map((char, idx) => (
                        <span
                          key={idx}
                          className="w-8 h-9 flex items-center justify-center rounded-md bg-blue-950/60 border border-blue-500/40 text-blue-300"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(generatedLink.pinCode, 'pin')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    {copiedPin ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedPin ? 'تم نسخ الرمز' : 'نسخ PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={generatedLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md"
                >
                  <ExternalLink size={14} />
                  <span>فتح الرابط ومعاينته كعميل</span>
                </a>

                <button
                  onClick={onClose}
                  className="py-2.5 px-5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* 1. Client / Workspace Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-400" />
                  <span>تحديد العميل / مساحة العمل المستهدفة</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => {
                      const newWsId = e.target.value;
                      setSelectedWorkspaceId(newWsId);
                      setSelectedFolderId('');
                      setIsTitleManual(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer pr-10"
                  >
                    {workspaceList.map((ws) => (
                      <option key={ws.id} value={ws.id} className="bg-slate-900 py-1 text-slate-100">
                        {ws.clientName ? `👤 ${ws.clientName} — ` : '🏢 '}
                        {ws.name} ({ws.driveLetter})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>

              {/* 2. Target Folder / Scope Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Folder size={14} className="text-blue-400" />
                    <span>تحديد المجلد ونطاق المشاركة</span>
                  </label>
                  {loadingFolders && (
                    <span className="text-[11px] text-blue-400 flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin" />
                      <span>جاري فحص المجلدات...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedFolderId}
                    onChange={(e) => {
                      setSelectedFolderId(e.target.value);
                      setIsTitleManual(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer pr-10"
                  >
                    <option value="" className="bg-slate-900 py-1 font-semibold text-blue-300">
                      🌐 كامل مساحة العمل (وصول شامل لكافة مجلدات وملفات العميل)
                    </option>
                    {folderList.map((folder) => {
                      const countText =
                        folder._count && folder._count.files > 0 ? ` [${folder._count.files} ملف]` : '';
                      return (
                        <option key={folder.id} value={folder.id} className="bg-slate-900 py-1 text-slate-200">
                          📁 {folder.name} &nbsp;({folder.path}) {countText}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown size={15} />
                  </div>
                </div>

                {/* Scope Notice */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] leading-relaxed">
                  {selectedFolderId ? (
                    <div className="text-amber-400 flex items-start gap-1.5">
                      <span className="mt-0.5">⚠️</span>
                      <span>
                        <strong>نظام العزل المقيد (Subfolder Isolation):</strong> سيتم حصر العميل في هذا المجلد فقط
                        مع منع تصفح أو الرجوع لأي مجلدات أعلى منه.
                      </span>
                    </div>
                  ) : (
                    <div className="text-blue-400 flex items-start gap-1.5">
                      <span className="mt-0.5">ℹ️</span>
                      <span>
                        <strong>وصول كامل (Root Access):</strong> سيتمكن العميل من تصفح كافة مجلدات الشركات والملفات
                        في هذا القرص بالكامل.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Link Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان الرابط (يظهر في ترويسة صفحة العميل)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsTitleManual(true);
                  }}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 4. 6-Digit PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-blue-400" />
                    <span>رمز الأمان السري (6 أرقام)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>توليد تلقائي عشوائي</span>
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  dir="ltr"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest font-bold bg-slate-950 border border-blue-500/40 rounded-lg text-blue-300 placeholder-slate-600 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 5. Expiry Selector & Custom DateTime */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-400" />
                  <span>مدة وتاريخ انتهاء صلاحية الرابط</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs mb-2">
                  {[
                    { value: 'never', label: 'دائم' },
                    { value: '1', label: '24 ساعة' },
                    { value: '3', label: '3 أيام' },
                    { value: '7', label: '7 أيام' },
                    { value: '30', label: '30 يوماً' },
                    { value: 'custom', label: 'تاريخ مخصص' },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setExpiryType(option.value as any)}
                      className={`py-2 px-1 text-center rounded-lg border text-[11px] transition-all font-medium ${
                        expiryType === option.value
                          ? 'bg-blue-600/25 border-blue-500 text-blue-300 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {expiryType === 'custom' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 animate-in fade-in">
                    <label className="block text-[11px] text-slate-400 font-medium">
                      حدد تاريخ ووقت انتهاء الصلاحية المخصص:
                    </label>
                    <input
                      type="datetime-local"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      required={expiryType === 'custom'}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* 6. Download Permissions Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  صلاحية تنزيل وتحميل الملفات للعميل
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllowDownload(true)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      allowDownload
                        ? 'bg-blue-600/15 border-blue-500/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      <Download size={14} className="text-emerald-400" />
                      <span>سماح بالتحميل والمعاينة</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      يستطيع العميل تنزيل الملفات واستخراج مجلد ZIP كامل
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllowDownload(false)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      !allowDownload
                        ? 'bg-amber-600/15 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      <Eye size={14} className="text-amber-400" />
                      <span>المعاينة فقط (View Only)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      يُمنع التنزيل ويقتصر العميل على استعراض وقراءة الملفات
                    </p>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-6 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock size={14} />
                  <span>{loading ? 'جاري التوليد...' : 'توليد الرابط وحفظ PIN'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
