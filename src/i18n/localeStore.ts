import { DEFAULT_LOCALE, type I18nKey, type I18nParams, type Locale, normalizeStoredLocale, resolveBrowserLocale, translateWithLocale } from './i18n';

export const LOCALE_STORAGE_KEY = 'bookd.web.locale';

type Listener = (locale: Locale) => void;

const listeners = new Set<Listener>();

function getStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function getNavigatorLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  return resolveBrowserLocale(navigator.languages, navigator.language);
}

function resolveInitialLocale(): Locale {
  const stored = normalizeStoredLocale(getStorage()?.getItem(LOCALE_STORAGE_KEY));
  return stored ?? getNavigatorLocale();
}

let currentLocale: Locale = resolveInitialLocale();

function notify() {
  for (const listener of listeners) listener(currentLocale);
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function setCurrentLocale(locale: Locale): void {
  if (currentLocale === locale) {
    getStorage()?.setItem(LOCALE_STORAGE_KEY, locale);
    return;
  }
  currentLocale = locale;
  getStorage()?.setItem(LOCALE_STORAGE_KEY, locale);
  notify();
}

export function subscribeLocale(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function translate(key: I18nKey, params?: I18nParams): string {
  return translateWithLocale(currentLocale, key, params);
}

export function resetLocaleForTests(): void {
  currentLocale = resolveInitialLocale();
  notify();
}
