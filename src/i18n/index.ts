export { LanguageSelector } from './LanguageSelector';
export { LocaleProvider, useI18n } from './LocaleProvider';
export {
  createTranslator,
  DEFAULT_LOCALE,
  flattenResourceKeys,
  getIntl,
  getIntlMessages,
  isSupportedLocale,
  normalizeLocale,
  normalizeStoredLocale,
  resolveBrowserLocale,
  SUPPORTED_LOCALES,
  translateWithLocale,
  type I18nKey,
  type I18nParams,
  type Locale,
  type TFunction
} from './i18n';
export { en, resources, zhCN } from './resources';
export {
  getCurrentLocale,
  LOCALE_STORAGE_KEY,
  resetLocaleForTests,
  setCurrentLocale,
  subscribeLocale,
  translate
} from './localeStore';
