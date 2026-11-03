'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  RotateCw,
  Search,
  LayoutGrid,
  List,
  Download,
  Share2,
  Trash2,
  Eye,
  HardDrive,
  FolderPlus,
  Upload,
  FolderUp,
  FileUp,
  CheckCircle2,
  Layers,
  Archive,
  Info,
  Calendar,
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import { FileIcon } from './FileIcon';
import { ConfirmationModal } from './ConfirmationModal';

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  color?: string | null;
  _count?: {
    children: number;
    files: number;
  };
}

export interface FileItem {
  id: string;
  name: string;
  size: string | number;
  mimeType: string;
  extension: string;
  createdAt: string;
  storageDriver?: string;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FileExplorerProps {
  isAdmin?: boolean;
  workspaceName: string;
  clientName?: string;
  driveLetter: string;
  color?: string;
  breadcrumbs: BreadcrumbItem[];
  folders: FolderItem[];
  files: FileItem[];
  currentFolderId: string | null;
  onNavigateFolder: (folderId: string | null) => void;
  onRefresh: () => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onDownloadZip?: () => void;
  // Admin specific actions
  onUploadClick?: () => void;
  onNewFolderClick?: () => void;
  onShareClick?: (folder: FolderItem | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteFile?: (fileId: string) => void;
  allowDownload?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  isAdmin = false,
  workspaceName,
  clientName,
  driveLetter,
  color = 'blue',
  breadcrumbs,
  folders,
  files,
  currentFolderId,
  onNavigateFolder,
  onRefresh,
  onPreviewFile,
  onDownloadFile,
  onDownloadZip,
  onUploadClick,
  onNewFolderClick,
  onShareClick,
  onDeleteFolder,
  onDeleteFile,
  allowDownload = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);

  const driveColors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  };
  const activeDriveColor = driveColors[color] || driveColors.blue;

  // Filter items by search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    return folders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    return files.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  // Navigate up one level in breadcrumbs
  const handleNavigateUp = () => {
    if (breadcrumbs.length <= 1) return;
    const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
    onNavigateFolder(parentBreadcrumb.id);
  };

  const totalItemsCount = filteredFolders.length + filteredFiles.length;
  const totalFilesSizeBytes = files.reduce((acc, f) => acc + Number(f.size || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Address & Actions Bar */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation buttons & Breadcrumbs address bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleNavigateUp}
              disabled={breadcrumbs.length <= 1}
              title="الانتقال للمجلد الأعلى"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={onRefresh}
              title="تحديث المحتويات"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* Breadcrumb Trail Address Bar */}
          <div className="flex-1 flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
            {/* Root Icon / Drive Indicator */}
            {isAdmin ? (
              <span className={`flex items-center gap-1.5 font-bold flex-shrink-0 ml-1 px-2 py-0.5 rounded-lg border text-xs ${activeDriveColor}`}>
                <HardDrive size={13} />
                <span>القرص ({driveLetter})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-blue-400 flex-shrink-0 ml-1">
                <Folder size={14} />
                <span>المجلد الرئيسي</span>
              </span>
            )}

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const displayName =
                idx === 0
                  ? isAdmin
                    ? crumb.name.replace(`${workspaceName} (${driveLetter})`, `القرص (${driveLetter})`)
                    : 'المجلد الرئيسي'
                  : crumb.name;

              return (
                <React.Fragment key={idx}>
                  <ChevronLeft size={14} className="text-slate-600 flex-shrink-0 mx-1" />
                  <button
                    onClick={() => onNavigateFolder(crumb.id)}
                    className={`font-medium transition-colors flex items-center gap-1 ${
                      isLast
                        ? 'text-slate-100 font-semibold cursor-default pointer-events-none'
                        : 'text-slate-400 hover:text-blue-400 cursor-pointer'
                    }`}
                  >
                    {displayName}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Search, View Mode, and Explorer Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="بحث في المجلد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 md:w-48 pl-3 pr-8 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض كأيقونات شبكية"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض كقائمة مفصلة"
            >
              <List size={15} />
            </button>
          </div>

          {/* Download Entire Folder as ZIP */}
          {allowDownload && onDownloadZip && files.length > 0 && (
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
              title="تنزيل جميع ملفات هذا المجلد كأرشيف ZIP"
            >
              <Archive size={14} className="text-orange-400" />
              <span className="hidden sm:inline">تحميل كـ ZIP</span>
            </button>
          )}

          {/* Admin Specific Actions */}
          {isAdmin && (
            <>
              {onNewFolderClick && (
                <button
                  onClick={onNewFolderClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                >
                  <FolderPlus size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">مجلد جديد</span>
                </button>
              )}

              {onUploadClick && (
                <button
                  onClick={onUploadClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm"
                >
                  <Upload size={14} />
                  <span>رفع محتويات</span>
                </button>
              )}

              {onShareClick && (
                <button
                  onClick={() => onShareClick(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 rounded-xl transition-colors"
                  title="مشاركة هذا المجلد وإنشاء رمز PIN"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">مشاركة المجلد</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Files & Folders Viewport */}
      <div className="flex-1 overflow-y-auto p-5">
        {totalItemsCount === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-4">
              <Folder size={32} />
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">هذا المجلد فارغ حالياً</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? 'لم يتم العثور على أي نتائج مطابقة لكلمة البحث في هذا المجلد.'
                : isAdmin
                ? 'يمكنك البدء برفع مجلد كامل بهيكليته أو إنشاء مجلدات فرعية جديدة.'
                : 'لا توجد ملفات أو مجلدات فرعية متوفرة في هذا المسار.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="space-y-6">
            {/* Subfolders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Folder size={14} className="text-amber-400" />
                  <span>المجلدات ({filteredFolders.length})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => onNavigateFolder(folder.id)}
                      className="group relative p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                          <Folder size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate transition-colors">
                            {folder.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {folder._count?.children || 0} مجلد • {folder._count?.files || 0} ملف
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div
                          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onShareClick && (
                            <button
                              onClick={() => onShareClick(folder)}
                              title="مشاركة هذا المجلد برمز PIN"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 rounded-lg transition-colors"
                            >
                              <Share2 size={13} />
                            </button>
                          )}
                          {onDeleteFolder && (
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'folder',
                                  id: folder.id,
                                  name: folder.name,
                                });
                              }}
                              title="حذف المجلد"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/80 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            {filteredFiles.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers size={14} className="text-blue-400" />
                  <span>الملفات ({filteredFiles.length})</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => onPreviewFile(file)}
                      className="group relative p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex flex-col items-center text-center shadow-sm"
                    >
                      {/* File Icon thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                        <FileIcon extension={file.extension} mimeType={file.mimeType} size={24} />
                      </div>

                      {/* File Name */}
                      <p
                        className="text-xs font-medium text-slate-200 group-hover:text-blue-300 w-full truncate mb-1"
                        title={file.name}
                      >
                        {file.name}
                      </p>

                      {/* File Size */}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatBytes(file.size)}
                      </span>

                      {/* Quick Actions Overlay (Visible on mobile touch, hover on desktop) */}
                      <div
                        className="absolute top-2 left-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-slate-900/90 rounded-lg p-0.5 border border-slate-700 shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onPreviewFile(file)}
                          title="معاينة الملف"
                          className="p-1 text-slate-300 hover:text-blue-400 transition-colors"
                        >
                          <Eye size={12} />
                        </button>
                        {allowDownload && (
                          <button
                            onClick={() => onDownloadFile(file)}
                            title="تحميل الملف"
                            className="p-1 text-slate-300 hover:text-emerald-400 transition-colors"
                          >
                            <Download size={12} />
                          </button>
                        )}
                        {isAdmin && onDeleteFile && (
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'file',
                                id: file.id,
                                name: file.name,
                              });
                            }}
                            title="حذف الملف"
                            className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View Mode (Details Table) */
          <div className="border border-slate-800/80 rounded-xl overflow-x-auto bg-slate-950/40">
            <table className="w-full min-w-[560px] text-right text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">الاسم</th>
                  <th className="py-2.5 px-4 font-semibold w-28">النوع</th>
                  <th className="py-2.5 px-4 font-semibold w-28">الحجم</th>
                  <th className="py-2.5 px-4 font-semibold w-40">تاريخ الإضافة</th>
                  <th className="py-2.5 px-4 font-semibold w-24 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Folders in list */}
                {filteredFolders.map((folder) => (
                  <tr
                    key={folder.id}
                    onClick={() => onNavigateFolder(folder.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Folder size={18} className="text-amber-400 flex-shrink-0" />
                        <span className="font-medium text-slate-200 group-hover:text-blue-400">
                          {folder.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">مجلد ملفات</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">
                      {folder._count?.files || 0} ملف
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">-</td>
                    <td className="py-2.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && onShareClick && (
                          <button
                            onClick={() => onShareClick(folder)}
                            title="مشاركة هذا المجلد برمز PIN"
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Share2 size={14} />
                          </button>
                        )}
                        {isAdmin && onDeleteFolder && (
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'folder',
                                id: folder.id,
                                name: folder.name,
                              });
                            }}
                            title="حذف المجلد"
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Files in list */}
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => onPreviewFile(file)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileIcon extension={file.extension} mimeType={file.mimeType} size={18} />
                        <span className="font-medium text-slate-200 group-hover:text-blue-400 truncate">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono uppercase">
                      {file.extension}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewFile(file)}
                          title="معاينة"
                          className="p-1 text-slate-400 hover:text-blue-400"
                        >
                          <Eye size={14} />
                        </button>
                        {allowDownload && (
                          <button
                            onClick={() => onDownloadFile(file)}
                            title="تحميل"
                            className="p-1 text-slate-400 hover:text-emerald-400"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {isAdmin && onDeleteFile && (
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'file',
                                id: file.id,
                                name: file.name,
                              });
                            }}
                            title="حذف الملف"
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explorer Bottom Status Bar */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>{folders.length} مجلدات</span>
          <span>•</span>
          <span>{files.length} ملفات</span>
          <span>•</span>
          <span className="font-mono">إجمالي الحجم: {formatBytes(totalFilesSizeBytes)}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span>Drive: {driveLetter}</span>
        </div>
      </div>

      {/* Styled Confirmation Modal (No native browser popups) */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'folder' && onDeleteFolder) {
            onDeleteFolder(deleteTarget.id);
          } else if (deleteTarget.type === 'file' && onDeleteFile) {
            onDeleteFile(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        title={deleteTarget?.type === 'folder' ? 'تأكيد حذف المجلد' : 'تأكيد حذف الملف'}
        message={
          deleteTarget?.type === 'folder'
            ? `هل أنت متأكد من رغبتك في حذف المجلد وجميع الملفات والمجلدات الفرعية داخله نهائياً؟`
            : `هل أنت متأكد من رغبتك في حذف هذا الملف نهائياً من مساحة التخزين؟`
        }
        itemName={deleteTarget?.name}
        confirmText="حذف نهائي"
      />
    </div>
  );
};
