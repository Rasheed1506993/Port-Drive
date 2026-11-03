import React from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileCheck,
  File,
} from 'lucide-react';
import { getFileCategory } from '@/lib/utils';

interface FileIconProps {
  extension: string;
  mimeType?: string;
  className?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({
  extension,
  mimeType = '',
  className = 'w-6 h-6',
  size = 24,
}) => {
  const category = getFileCategory(extension, mimeType);
  const ext = extension.toLowerCase().replace('.', '');

  switch (category) {
    case 'image':
      return <FileImage className={`text-sky-400 ${className}`} size={size} />;
    case 'video':
      return <FileVideo className={`text-purple-400 ${className}`} size={size} />;
    case 'audio':
      return <FileAudio className={`text-pink-400 ${className}`} size={size} />;
    case 'pdf':
      return <FileText className={`text-red-400 ${className}`} size={size} />;
    case 'document':
      if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet className={`text-emerald-400 ${className}`} size={size} />;
      }
      return <FileText className={`text-blue-400 ${className}`} size={size} />;
    case 'code':
      return <FileCode className={`text-amber-400 ${className}`} size={size} />;
    case 'archive':
      return <FileArchive className={`text-orange-400 ${className}`} size={size} />;
    default:
      return <File className={`text-slate-400 ${className}`} size={size} />;
  }
};
