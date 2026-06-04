## 1. I18n Infrastructure

- [x] 1.1 Add `src/i18n/` locale types, `zh-CN` base resources, `en` resources with compile-time key parity, and a translator helper with interpolation support.
- [x] 1.2 Add locale normalization utilities for stored values, `navigator.languages`, `navigator.language`, and unsupported fallback to `zh-CN`.
- [x] 1.3 Add a non-React locale store with local-storage persistence and change subscription.
- [x] 1.4 Add `LocaleProvider`, `useI18n()`, and a reusable language selector component.
- [x] 1.5 Wrap the app/router entry with `LocaleProvider`.

## 2. API Client Integration

- [x] 2.1 Replace `getBrowserLanguage()` usage in `src/api/client.ts` with selected-locale lookup from the locale store.
- [x] 2.2 Localize client-side fallback `ApiError` messages for unknown backend failures and network failures.
- [x] 2.3 Preserve existing auth token, JSON, multipart upload, 204, success unwrap, and backend error handling behavior.

## 3. UI Localization

- [x] 3.1 Add the language selector to login and setup pages.
- [x] 3.2 Add the language selector to the admin top bar and reader shell surface.
- [x] 3.3 Convert shared components and states (`Modal`, confirm, toast, loading, empty, error) to translation keys.
- [x] 3.4 Convert auth/setup/root routing and reader shell text to translation keys.
- [x] 3.5 Convert admin layout, dashboard, users, invite tokens, book management, tags, TXT rules, and background parsing text to translation keys.
- [x] 3.6 Verify API-provided values remain rendered as raw data and are not sent through the translator.

## 4. Tests

- [x] 4.1 Add tests for resource key parity, translation lookup, interpolation, locale normalization, browser fallback, invalid stored locale handling, persistence, and subscription updates.
- [x] 4.2 Update `src/api/client.test.ts` to verify selected-locale `Accept-Language` for `en` and `zh-CN` while preserving existing API client tests.
- [x] 4.3 Add React rendering tests for localized login/setup surfaces, admin layout language switching, one admin management page, and shared dialog/state components.
- [x] 4.4 Add a hardcoded user-facing Chinese text regression guard outside `src/i18n/`, with explicit allowances for fixtures and domain data examples.

## 5. Verification

- [x] 5.1 Run `npm run typecheck`.
- [x] 5.2 Run `npm test -- --run`.
- [x] 5.3 Run `openspec validate add-web-i18n --strict` from `bookd-web`.
