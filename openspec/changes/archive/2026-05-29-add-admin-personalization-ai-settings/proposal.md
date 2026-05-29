## Why

Administrators need a Web management surface for personalization settings and future TTS-ready AI service configuration. The UI should organize provider, endpoint, and model configuration clearly while keeping LLM support as an optional preserved capability rather than a product workflow.

## What Changes

- Add a personalization navigation entry and admin route.
- Add system preferences and AI service child tabs under the personalization route.
- Allow providers, endpoints, and models to be created, edited, deleted, enabled/disabled, and prioritized.
- Represent TTS and LLM support as independent checkboxes on model forms only; provider and endpoint forms do not show or submit capability fields.
- Show API key configuration state without displaying plaintext secrets.
- Add typed API client methods and types for the new backend contracts.
- Add Chinese and English i18n resources for all new user-facing text.
- Do not add TTS generation UI, LLM chat UI, reader AI workflows, or external AI execution controls.

## Capabilities

### New Capabilities
- `react-admin-personalization-settings`: Defines the React admin personalization page, AI provider configuration UI, i18n behavior, and focused Web tests.

### Modified Capabilities
- None.

## Impact

- `src/router.tsx` and `src/admin/AdminLayout.tsx`: new admin route and navigation entry.
- `src/admin/`: new personalization settings page with lightweight provider/endpoint/model hierarchy and related UI helpers.
- `src/api/bookdApi.ts` and `src/api/types.ts`: typed settings and AI configuration API access.
- `src/i18n/resources.ts`: new localized strings.
- `test/admin/`, `test/api/`, and `test/i18n/`: focused Vitest coverage.
