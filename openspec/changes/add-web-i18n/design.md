## Context

`bookd-web` uses React Router, Vitest, and a shared typed API client. The API client currently derives `Accept-Language` from `navigator.language`, while pages and shared components render hardcoded Chinese UI text. The backend already supports `zh-CN` and `en` through the same `Accept-Language` header.

## Goals / Non-Goals

**Goals:**

- Add Chinese and English resources for all Web-owned user-facing text.
- Keep locale selection reactive in React and readable by non-React API code.
- Persist the selected locale locally and fall back to browser language when unset.
- Make the selected locale control `Accept-Language`.
- Test the i18n utilities, API language header, and representative localized UI.

**Non-Goals:**

- No backend changes.
- No localization for API-provided book metadata, tags, filesystem paths, or reading content.
- No server-side rendering, lazy-loaded locale bundles, or remote translation loading.
- No additional locale beyond `zh-CN` and `en`.

## Decisions

1. Use `react-intl` as the runtime while storing resources in TypeScript modules.
   - `zh-CN` is the base catalog.
   - `en` uses a widened `satisfies` shape or equivalent typing to enforce key parity.
   - Nested TypeScript resources are flattened into React Intl message maps at the i18n boundary.
   - React components format through `IntlProvider` and `useIntl().formatMessage`; non-React code formats through React Intl's imperative `createIntl()` API.
   - Alternative considered: JSON resources. JSON is easy to edit but weaker for compile-time parity without additional tooling.
   - Alternative considered: `react-i18next`. It is strong for namespace-heavy and remote translation workflows, but React Intl better fits Bookd's expected needs around counts, dates, numbers, relative time, and ICU-style message formatting.

2. Keep locale state in a small non-React store plus a React Intl provider.
   - `getCurrentLocale()` and `setCurrentLocale()` are available to `apiClient`.
   - `LocaleProvider` subscribes to locale changes, wraps React Intl's `IntlProvider`, and exposes `locale`, `setLocale`, and a typed `t` adapter for existing components.
   - Local storage key is stable and Web-specific, for example `bookd.web.locale`.
   - Alternative considered: React context only. That would make API code depend on component context or stale browser language.

3. Put language switching in shell-level UI.
   - Login and setup pages include the selector near the form chrome.
   - Admin layout includes it in the top bar.
   - Reader shell includes it when reader-level controls are available.
   - The selector is a compact control with localized labels and accessible names.

4. Treat backend and domain strings separately.
   - Backend-provided error messages are displayed as received.
   - Client-side fallback messages from `ApiError` construction are translated by the Web catalog.
   - Data values returned by APIs are not translated or normalized.

5. Use tests to control broad text replacement risk.
   - Unit tests cover locale resolution, persistence, selected-locale headers, and resource parity.
   - Rendering tests cover the surfaces most likely to regress: auth/setup, admin layout, one admin management flow, and shared dialog/state components.
   - A narrow hardcoded-Chinese guard can scan source files outside i18n resources while allowing fixtures and domain examples.

## Risks / Trade-offs

- [Risk] Hardcoded text replacement touches many files. -> Mitigation: convert by surface and run focused rendering tests after each group.
- [Risk] The API client can be imported before React mounts. -> Mitigation: initialize locale store independently of React and let the provider subscribe to it.
- [Risk] Missing interpolation variables produce confusing UI. -> Mitigation: rely on React Intl formatting and test dynamic examples such as counts or usernames.
- [Risk] Source scanning can produce false positives for fixture/domain examples. -> Mitigation: keep the guard allowlist explicit and scoped to test fixtures or API data examples.

## Migration Plan

1. Add React Intl-backed i18n infrastructure and tests without changing visible UI.
2. Wire provider into the app entry and update API client language source.
3. Add the selector to auth/setup/admin/reader shell surfaces.
4. Replace hardcoded UI strings by surface: shared components, auth/setup, admin layout, admin pages, reader shell.
5. Expand tests and run `npm run typecheck` plus `npm test -- --run`.
