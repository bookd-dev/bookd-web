## 1. Routing And API Types

- [x] 1.1 Add `/admin/personalization` to the React router.
- [x] 1.2 Add a personalization navigation item to the admin layout.
- [x] 1.3 Add TypeScript types for time zone settings, AI providers, endpoints, models, requests, and responses.
- [x] 1.4 Add typed API client methods for settings, providers, endpoints, and models.

## 2. Personalization Page

- [x] 2.1 Implement the personalization page shell with system preferences and AI services child tabs.
- [x] 2.2 Implement time zone loading, editing, saving, success state, and error state.
- [x] 2.3 Implement provider list rendering, create/edit/delete, enable/disable, and priority editing without capability fields.
- [x] 2.4 Implement endpoint list rendering under providers, create/edit/delete, enable/disable, base URL, concurrency, API key write-only input, and priority editing without capability fields.
- [x] 2.5 Implement model list rendering under endpoints, create/edit/delete, enable/disable, capability checkboxes, and priority editing.
- [x] 2.6 Ensure the page exposes configuration only and does not add AI execution controls.

## 3. Localization

- [x] 3.1 Add Chinese and English resource keys for personalization navigation, time zone settings, AI providers, endpoints, models, capability labels, form validation, empty states, and toasts.
- [x] 3.2 Ensure new UI and fallback text use `useI18n()` or existing i18n helpers instead of hardcoded user-facing text.

## 4. Web Tests

- [x] 4.1 Add tests for admin navigation and personalization route rendering.
- [x] 4.2 Add tests for time zone loading and save behavior.
- [x] 4.3 Add tests for provider, endpoint, and model form validation, API interactions, and model-only capability controls.
- [x] 4.4 Add tests that endpoint API keys are not rendered after create or update flows.
- [x] 4.5 Add or update i18n rendering and resource parity tests for the new page.
- [x] 4.6 Run `npm run typecheck` and `npm test -- --run` in `bookd-web/`.
