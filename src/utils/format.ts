import type { Book } from '../api/types';
import { getCurrentLocale, translate, type TFunction } from '../i18n';

export function formatFileSize(bytes?: number | null, t: TFunction = translate): string {
  if (!bytes) return t('common.unknown');
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDateTime(value?: string | null, t: TFunction = translate): string {
  if (!value) return t('common.unknown');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatRelativeBookTime(book: Book, t: TFunction = translate): string {
  if (!book.updatedAt) return t('time.recentlyUpdated');
  const date = new Date(book.updatedAt);
  if (Number.isNaN(date.getTime())) return t('time.recentlyUpdated');
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return t('time.today');
  if (diffDays === 1) return t('time.yesterday');
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
  if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) });
  if (diffDays < 365) return t('time.monthsAgo', { count: Math.floor(diffDays / 30) });
  return t('time.yearsAgo', { count: Math.floor(diffDays / 365) });
}

export function formatNumber(value: number): string {
  return value.toLocaleString(getCurrentLocale());
}
