## Context

The Web admin shell uses React Router, centralized API access, and `react-intl` resources. Existing admin pages use dense, restrained management layouts with shared loading, toast, confirm, and modal components. The personalization page should follow those patterns and avoid hardcoded user-facing text.

The backend will provide settings and AI configuration APIs. The Web app is responsible for making provider/endpoint/model relationships understandable and for preventing users from thinking TTS or LLM execution already exists.

## Goals / Non-Goals

**Goals:**
- Add a new admin route for personalization settings.
- Provide a system preference form for application time zone.
- Provide AI provider, endpoint, and model CRUD forms.
- Use checkboxes for `supportsTts` and `supportsLlm` on model forms only.
- Display provider, endpoint, and model priorities and allow editing them.
- Never display plaintext API keys.
- Keep all visible text localized through existing i18n resources.

**Non-Goals:**
- No audio generation controls.
- No LLM chat or prompt controls.
- No provider testing button unless backend execution support is added by a later change.
- No drag-and-drop requirement for priority ordering in the initial implementation.

## Decisions

### Use one personalization page with child tabs

The route `/admin/personalization` will render one page with child tabs:

- System preferences: current time zone, editable time zone ID, save state.
- AI services: provider list with nested endpoints and models.

This keeps settings discoverable without adding multiple top-level navigation entries. AI services remain inside personalization because they are configuration for future features, not active content workflows.

### Use lightweight nested management UI for providers, endpoints, and models

Providers are the primary list items. Each provider shows its endpoints, and each endpoint shows its models. This mirrors the data ownership model and avoids forcing administrators to switch between separate tables just to configure a usable TTS-capable model.

The nested UI should avoid heavy repeated background panels. Provider rows should be the main frame, endpoints should be separated by simple dividers, and models should use compact rows so the hierarchy is readable without excessive boxes.

Each row should use a two-line text hierarchy. The first line is the primary name or URL. The second line is smaller and muted: providers show provider kind and priority, endpoints show concurrency, priority, and API key configured/missing state, and models show model name, priority, and model-level capability labels. API key state and model capability labels should be metadata text rather than separate right-aligned pills.

### Use capability checkboxes only for models

Model forms will expose TTS and LLM as independent checkboxes. Provider and endpoint forms will not render or submit TTS/LLM fields because capability is a model-level concern. Validation messages should make clear that at least one model capability must be selected.

### Treat API key as a write-only field

Endpoint forms will show whether an API key is configured. Editing an endpoint should leave the stored key unchanged when the key input is blank and replace it only when a new key is submitted. The UI must not show any plaintext key returned from the backend. In endpoint lists, API key configured/missing state should appear inline in the endpoint metadata line with concurrency and priority.

## Risks / Trade-offs

- Nested forms can become dense. → Keep provider rows scannable, use lightweight endpoint/model rows, and use modals or focused inline editors for create/edit actions.
- Users may expect immediate TTS behavior. → Label the page as service configuration and omit generation/test controls.
- Priority fields can be abstract. → Use explicit labels such as provider priority, endpoint priority, and model priority.
- i18n coverage can regress as forms expand. → Add/extend resource parity and representative rendering tests.

## Verification

The implementation should run Web typecheck and Vitest. Tests should cover the admin navigation entry, localized personalization rendering, API client calls, form validation, secret masking, and representative create/edit/delete interactions.
