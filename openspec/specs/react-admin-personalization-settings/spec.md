# react-admin-personalization-settings Specification

## Purpose
TBD - created by archiving change add-admin-personalization-ai-settings. Update Purpose after archive.
## Requirements
### Requirement: React admin exposes personalization settings
The React admin application SHALL provide a personalization settings route for administrators.

#### Scenario: Admin opens personalization route
- **WHEN** an authenticated administrator opens `/admin/personalization`
- **THEN** the application SHALL render the personalization settings page.
- **AND** the admin navigation SHALL include a personalization settings entry.
- **AND** the page SHALL group system preferences and AI services under child tabs.

#### Scenario: Non-admin opens personalization route
- **WHEN** an authenticated non-admin user opens `/admin/personalization`
- **THEN** the existing admin route guard SHALL redirect the user away from the admin shell.

### Requirement: Personalization page manages application time zone
The React admin application SHALL allow administrators to view and save the application time zone.

#### Scenario: Time zone loads
- **WHEN** the personalization page loads successfully
- **THEN** the page SHALL display the current application time zone from the backend.

#### Scenario: Admin saves time zone
- **WHEN** an administrator enters a valid time zone ID and saves
- **THEN** the page SHALL call the backend settings API.
- **AND** the page SHALL show a success state or toast after the save completes.

#### Scenario: Time zone save fails
- **WHEN** the backend rejects the time zone update
- **THEN** the page SHALL show the backend error message or localized fallback error.

### Requirement: Personalization page manages AI providers
The React admin application SHALL allow administrators to list, create, edit, delete, enable, disable, and prioritize AI providers.

#### Scenario: Providers load
- **WHEN** the personalization page loads AI service configuration
- **THEN** providers SHALL render in backend priority order.
- **AND** each provider SHALL show its enabled state as a switch without TTS/LLM capability controls.
- **AND** each provider SHALL render provider name as the primary line and provider kind plus priority as smaller muted metadata.
- **AND** each provider row SHALL keep provider edit as the only row-level management action besides the enabled switch.

#### Scenario: Admin saves provider
- **WHEN** an administrator submits a provider form with name, provider kind, priority, and enabled state
- **THEN** the page SHALL call the provider save API.
- **AND** the provider list SHALL refresh or update to reflect the saved value.
- **AND** the submitted provider payload SHALL NOT include TTS or LLM capability fields.

#### Scenario: Admin edits provider hierarchy
- **WHEN** an administrator opens the provider edit dialog
- **THEN** the dialog SHALL group provider fields, API endpoint management, and endpoint-owned model management into separate modules.
- **AND** provider deletion SHALL be available from the provider editor instead of the provider list row.

### Requirement: Personalization page manages provider endpoints
The React admin application SHALL allow administrators to manage API endpoints under each AI provider.

#### Scenario: Endpoints render under provider
- **WHEN** a provider has endpoint configuration
- **THEN** the page SHALL display those endpoints under the provider in priority order.
- **AND** each endpoint SHALL show base URL, enabled state, concurrency, and whether an API key is configured without TTS/LLM capability controls.
- **AND** each endpoint SHALL render base URL as the primary line and concurrency, priority, and API key configured/missing state as smaller muted metadata.
- **AND** endpoint rows in the AI service list SHALL NOT expose add, edit, or delete buttons.

#### Scenario: Admin manages endpoints from provider editor
- **WHEN** an administrator uses the API endpoint module inside the provider editor
- **THEN** the page SHALL allow endpoint create, edit, and delete operations under the selected provider.
- **AND** deleting an endpoint SHALL show a confirmation that its model configuration will also be deleted.

#### Scenario: Admin saves endpoint without API key
- **WHEN** an administrator edits an endpoint and leaves the API key input blank
- **THEN** the page SHALL submit the update without forcing a secret replacement.
- **AND** the UI SHALL continue to show whether a key is configured after the update.
- **AND** the submitted endpoint payload SHALL NOT include TTS or LLM capability fields.

#### Scenario: Admin enters endpoint API key
- **WHEN** an administrator creates or edits an endpoint with a new API key
- **THEN** the page SHALL send the key to the backend write API.
- **AND** the page SHALL NOT render the plaintext key after the request completes.

### Requirement: Personalization page manages endpoint models
The React admin application SHALL allow administrators to manage models under each provider endpoint.

#### Scenario: Models render under endpoint
- **WHEN** an endpoint has model configuration
- **THEN** the page SHALL display those models under the endpoint in priority order.
- **AND** each model SHALL show model name, display name, enabled state, priority, and TTS/LLM capability flags.
- **AND** each model SHALL render display name as the primary line and model name, priority, and TTS/LLM capability labels as smaller muted metadata.
- **AND** model rows in the AI service list SHALL NOT expose edit or delete buttons.

#### Scenario: Admin manages models from provider editor
- **WHEN** an administrator uses the model module inside the provider editor
- **THEN** the page SHALL allow model create, edit, and delete operations as child configuration of each API endpoint.
- **AND** model capability controls SHALL appear only in model forms.

#### Scenario: Admin saves model
- **WHEN** an administrator submits a model form with model name, display name, priority, enabled state, and at least one capability
- **THEN** the page SHALL call the model save API.
- **AND** the model list SHALL refresh or update to reflect the saved value.

#### Scenario: Model has no capability
- **WHEN** an administrator attempts to save a model with both TTS and LLM unchecked
- **THEN** the UI SHALL prevent submission or display a validation error.

### Requirement: React admin does not expose AI execution workflows
The React admin application SHALL expose AI service configuration only in this change.

#### Scenario: AI configuration page is rendered
- **WHEN** models have TTS or LLM enabled
- **THEN** the page SHALL NOT show controls for generating audio, sending LLM prompts, testing providers, retrying providers, or dispatching AI requests.

### Requirement: Personalization UI is localized and tested
The React admin personalization page SHALL use the existing Web i18n system and focused automated tests.

#### Scenario: Personalization text is rendered
- **WHEN** the active Web locale is Chinese or English
- **THEN** personalization labels, actions, validation text, empty states, and fallback errors SHALL render from localized resources.

#### Scenario: Personalization UI changes
- **WHEN** personalization navigation, forms, API client behavior, secret masking, or localized resources change
- **THEN** Web tests SHALL cover representative rendering, API calls, validation, and resource key parity.

