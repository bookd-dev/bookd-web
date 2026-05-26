import { createIntl, createIntlCache, type IntlShape } from 'react-intl';
import { resources, zhCN } from './resources';

export type Locale = keyof typeof resources;
export const SUPPORTED_LOCALES = ['zh-CN', 'en'] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = 'zh-CN';

type LeafPath<T, Prefix extends string = ''> = {
  [K in Extract<keyof T, string>]: T[K] extends string ? `${Prefix}${K}` : LeafPath<T[K], `${Prefix}${K}.`>;
}[Extract<keyof T, string>];

export type I18nKey = LeafPath<typeof zhCN>;
export type I18nParams = Record<string, string | number>;
export type TFunction = (key: I18nKey, params?: I18nParams) => string;

const intlCache = createIntlCache();
const intlByLocale = new Map<Locale, IntlShape>();
const messagesByLocale = new Map<Locale, Record<string, string>>();

export function isSupportedLocale(value: unknown): value is Locale {
  return value === 'zh-CN' || value === 'en';
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('en')) return 'en';
  return null;
}

export function normalizeStoredLocale(value: string | null | undefined): Locale | null {
  return isSupportedLocale(value) ? value : null;
}

export function resolveBrowserLocale(languages?: readonly string[] | null, language?: string | null): Locale {
  const candidates = [...(languages ?? []), language].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

function flattenMessages(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value).reduce<Record<string, string>>((messages, [key, nested]) => ({
    ...messages,
    ...flattenMessages(nested, prefix ? `${prefix}.${key}` : key)
  }), {});
}

export function getIntlMessages(locale: Locale): Record<I18nKey, string> {
  const cached = messagesByLocale.get(locale);
  if (cached) return cached as Record<I18nKey, string>;
  const messages = flattenMessages(resources[locale]);
  messagesByLocale.set(locale, messages);
  return messages as Record<I18nKey, string>;
}

export function getIntl(locale: Locale): IntlShape {
  const cached = intlByLocale.get(locale);
  if (cached) return cached;
  const intl = createIntl({
    locale,
    defaultLocale: DEFAULT_LOCALE,
    messages: getIntlMessages(locale)
  }, intlCache);
  intlByLocale.set(locale, intl);
  return intl;
}

export function translateWithLocale(locale: Locale, key: I18nKey, params?: I18nParams): string {
  return getIntl(locale).formatMessage({
    id: key,
    defaultMessage: getIntlMessages(DEFAULT_LOCALE)[key] ?? key
  }, params);
}

export function createTranslator(locale: Locale): TFunction {
  return (key, params) => translateWithLocale(locale, key, params);
}

export function flattenResourceKeys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, nested]) => flattenResourceKeys(nested, prefix ? `${prefix}.${key}` : key));
}
