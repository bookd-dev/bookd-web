import { en, flattenResourceKeys, getIntlMessages, LOCALE_STORAGE_KEY, normalizeLocale, normalizeStoredLocale, resetLocaleForTests, resolveBrowserLocale, setCurrentLocale, subscribeLocale, translate, translateWithLocale, zhCN } from '.';

describe('i18n utilities', () => {
  test('keeps Chinese and English resource keys in sync', () => {
    expect(flattenResourceKeys(en).sort()).toEqual(flattenResourceKeys(zhCN).sort());
  });

  test('translates with interpolation', () => {
    expect(translateWithLocale('zh-CN', 'tags.autoTagDone', { books: 2, tags: 3 })).toBe('处理 2 本，新增 3 个标签');
    expect(translateWithLocale('en', 'tags.autoTagDone', { books: 2, tags: 3 })).toBe('Processed 2 books, created 3 tags');
  });

  test('flattens nested resources for React Intl message lookup', () => {
    expect(getIntlMessages('en')['auth.login']).toBe('Sign In');
    expect(getIntlMessages('zh-CN')['books.scanDone']).toBe('扫描完成：发现 {found}，处理 {imported}');
  });

  test('normalizes browser locale candidates', () => {
    expect(normalizeLocale('zh-Hans-CN')).toBe('zh-CN');
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('fr-FR')).toBeNull();
  });

  test('only accepts exact stored locales', () => {
    expect(normalizeStoredLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeStoredLocale('en')).toBe('en');
    expect(normalizeStoredLocale('en-US')).toBeNull();
  });

  test('resolves browser fallback in priority order', () => {
    expect(resolveBrowserLocale(['fr-FR', 'en-US'], 'zh-CN')).toBe('en');
    expect(resolveBrowserLocale(['fr-FR'], 'zh-CN')).toBe('zh-CN');
    expect(resolveBrowserLocale(['fr-FR'], 'de-DE')).toBe('zh-CN');
  });

  test('persists locale and notifies subscribers', () => {
    setCurrentLocale('zh-CN');
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);

    setCurrentLocale('en');

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(listener).toHaveBeenCalledWith('en');
    expect(translate('auth.login')).toBe('Sign In');

    unsubscribe();
    resetLocaleForTests();
  });
});
