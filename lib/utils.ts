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


export interface WorkspaceColorTheme {
  name: string;
  badge: string;
  selectedBg: string;
  selectedBorder: string;
  dot: string;
  bar: string;
  text: string;
  border: string;
}

export const WORKSPACE_COLOR_THEMES: Record<string, WorkspaceColorTheme> = {
  blue: {
    name: 'أزرق',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    selectedBg: 'bg-blue-600/15',
    selectedBorder: 'border-blue-500/60 shadow-lg shadow-blue-950/40',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
  },
  emerald: {
    name: 'أخضر زمردي',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    selectedBg: 'bg-emerald-600/15',
    selectedBorder: 'border-emerald-500/60 shadow-lg shadow-emerald-950/40',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  purple: {
    name: 'بنفسجي',
    badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    selectedBg: 'bg-purple-600/15',
    selectedBorder: 'border-purple-500/60 shadow-lg shadow-purple-950/40',
    dot: 'bg-purple-500',
    bar: 'bg-purple-500',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
  },
  amber: {
    name: 'ذهبي / كهرماني',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    selectedBg: 'bg-amber-600/15',
    selectedBorder: 'border-amber-500/60 shadow-lg shadow-amber-950/40',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  rose: {
    name: 'وردي / ياقوتي',
    badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    selectedBg: 'bg-rose-600/15',
    selectedBorder: 'border-rose-500/60 shadow-lg shadow-rose-950/40',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
  },
  indigo: {
    name: 'نيلي / كحلي',
    badge: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    selectedBg: 'bg-indigo-600/15',
    selectedBorder: 'border-indigo-500/60 shadow-lg shadow-indigo-950/40',
    dot: 'bg-indigo-500',
    bar: 'bg-indigo-500',
    text: 'text-indigo-400',
    border: 'border-indigo-500/40',
  },
};

export function getWorkspaceColor(color?: string | null): WorkspaceColorTheme {
  if (color && WORKSPACE_COLOR_THEMES[color]) {
    return WORKSPACE_COLOR_THEMES[color];
  }
  return WORKSPACE_COLOR_THEMES.blue;
}
