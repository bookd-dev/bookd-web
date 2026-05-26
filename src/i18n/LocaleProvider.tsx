import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IntlProvider, useIntl, type IntlShape } from 'react-intl';
import { DEFAULT_LOCALE, getIntlMessages, type I18nKey, type I18nParams, type Locale, type TFunction } from './i18n';
import { getCurrentLocale, setCurrentLocale, subscribeLocale } from './localeStore';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

interface I18nContextValue extends LocaleContextValue {
  t: TFunction;
  intl: IntlShape;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(getCurrentLocale);

  useEffect(() => subscribeLocale(setLocaleState), []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: setCurrentLocale
  }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={getIntlMessages(locale)}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(LocaleContext);
  const intl = useIntl();
  if (!context) throw new Error('useI18n must be used inside LocaleProvider');
  const t = useCallback((key: I18nKey, params?: I18nParams) => intl.formatMessage({
    id: key,
    defaultMessage: getIntlMessages(DEFAULT_LOCALE)[key] ?? key
  }, params), [intl]);
  return { ...context, t, intl };
}
