import { Languages } from 'lucide-react';
import { SUPPORTED_LOCALES, type Locale } from './i18n';
import { useI18n } from './LocaleProvider';

const languageLabelKey: Record<Locale, 'language.zhCN' | 'language.en'> = {
  'zh-CN': 'language.zhCN',
  en: 'language.en'
};

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={compact ? 'language-selector compact' : 'language-selector'}>
      <Languages size={16} aria-hidden="true" />
      <span>{t('language.selectLabel')}</span>
      <select
        aria-label={t('language.selectLabel')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((item) => (
          <option key={item} value={item}>
            {t(languageLabelKey[item])}
          </option>
        ))}
      </select>
    </label>
  );
}
