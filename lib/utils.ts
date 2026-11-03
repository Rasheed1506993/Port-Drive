import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | bigint | string, decimals = 2): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : Number(bytes || 0);
  if (num === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(num) / Math.log(k));
  const val = parseFloat((num / Math.pow(k, i)).toFixed(dm));

  return `${val} ${sizes[i]}`;
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generate6DigitPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateShareToken(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function sanitizePath(inputPath: string): string {
  return inputPath
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^[\/.]+|[\/.]+$/g, '');
}

export function getFileCategory(extension: string, mimeType = ''): 'image' | 'video' | 'audio' | 'document' | 'pdf' | 'archive' | 'code' | 'other' {
  const ext = extension.toLowerCase().replace(/^\./, '');
  
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archive';
  }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) {
    return 'document';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'sql', 'yaml', 'yml', 'md'].includes(ext)) {
    return 'code';
  }
  return 'other';
}
