## Why

The React Web app currently relies on hardcoded Chinese UI text and browser-language-only API headers. A dedicated Web i18n capability is needed so users can explicitly choose Chinese or English and receive matching Web-owned UI and backend messages.

## What Changes

- Add `react-intl` plus a typed Chinese/English translation catalog and Web locale provider.
- Persist locale preference with browser-language fallback.
- Add language switching to shared Web surfaces.
- Replace Web-owned hardcoded UI strings and client-side fallback errors with translation keys.
- Update the API client to send the selected locale as `Accept-Language`.
- Add focused Vitest coverage for resource parity, locale fallback, persistence, API language headers, and representative localized rendering.

## Capabilities

### New Capabilities

- `react-web-i18n`: Defines React Web app internationalization behavior for Chinese/English UI text, locale persistence, language switching, API header propagation, and test coverage.

### Modified Capabilities

- None.

## Impact

- `src/i18n/`: new locale resources, React Intl provider/adapter, hook, locale store, and helper utilities.
- `package.json` and `package-lock.json`: add `react-intl`.
- `src/api/client.ts` and API client tests: selected-locale `Accept-Language` and localized fallback errors.
- `src/routes/`, `src/admin/`, and `src/components/`: localized text replacement and language selector placement.
- `src/**/*.test.ts(x)`: new and updated tests.
