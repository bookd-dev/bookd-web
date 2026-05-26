## ADDED Requirements

### Requirement: React Web renders localized UI
The React Web app SHALL render Web-owned user-facing text from Chinese and English translation resources.

#### Scenario: Chinese locale renders Web text
- **WHEN** the active locale is `zh-CN`
- **THEN** login, setup, reader shell, admin navigation, admin pages, shared dialogs, state messages, toast text, form labels, form actions, and client-side fallback errors SHALL render Web-owned text in Simplified Chinese.

#### Scenario: English locale renders Web text
- **WHEN** the active locale is `en`
- **THEN** login, setup, reader shell, admin navigation, admin pages, shared dialogs, state messages, toast text, form labels, form actions, and client-side fallback errors SHALL render Web-owned text in English.

#### Scenario: API data is rendered
- **WHEN** API responses include book titles, author names, tag names, filesystem paths, user names, or reading content
- **THEN** the React Web app SHALL render those data values unchanged.

### Requirement: Locale preference is selectable and persistent
The React Web app SHALL provide a user-facing selector for `zh-CN` and `en`, persist the selected value, and fall back predictably when no valid preference exists.

#### Scenario: User selects a locale
- **WHEN** a user selects `en` or `zh-CN`
- **THEN** the app SHALL update currently rendered localized text without requiring a full page reload.
- **AND** the app SHALL store the selected locale in browser local storage.

#### Scenario: App starts with a stored locale
- **WHEN** a stored locale is `en` or `zh-CN`
- **THEN** the app SHALL use that locale before consulting browser language settings.

#### Scenario: App starts without a valid stored locale
- **WHEN** no stored locale exists or the stored locale is unsupported
- **THEN** the app SHALL resolve Chinese browser language preferences to `zh-CN`.
- **AND** it SHALL resolve English browser language preferences to `en`.
- **AND** it SHALL resolve unsupported browser language preferences to `zh-CN`.

### Requirement: API client propagates selected locale
The shared API client SHALL use the active Web locale when building the `Accept-Language` request header.

#### Scenario: English request is sent
- **WHEN** the active Web locale is `en`
- **THEN** a Web API request SHALL include `Accept-Language: en`.

#### Scenario: Chinese request is sent
- **WHEN** the active Web locale is `zh-CN`
- **THEN** a Web API request SHALL include `Accept-Language: zh-CN`.

#### Scenario: Existing API behavior is preserved
- **WHEN** the API client sends JSON, multipart, authenticated, no-content, success-envelope, or backend-error requests
- **THEN** the existing request headers, body encoding, response unwrapping, and `ApiError` shape SHALL remain compatible except for the selected-locale language header source.

### Requirement: I18n behavior is covered by tests
The React Web app SHALL include automated tests for locale utilities, translation resources, API header propagation, and representative localized rendering.

#### Scenario: Translation resources change
- **WHEN** either Chinese or English resources are modified
- **THEN** tests or type checks SHALL fail if the two locale catalogs no longer provide the same translation keys.

#### Scenario: Locale state changes
- **WHEN** locale normalization, persistence, fallback, or switching behavior changes
- **THEN** unit tests SHALL cover valid locales, unsupported stored locales, browser fallback, and local-storage persistence.

#### Scenario: Localized UI changes
- **WHEN** localized login, setup, admin layout, admin management, dialog, or state components change
- **THEN** React rendering tests SHALL verify representative Chinese and English output for the changed surface.

#### Scenario: API client language behavior changes
- **WHEN** API client language behavior changes
- **THEN** API client tests SHALL verify selected-locale `Accept-Language` behavior and preserve existing auth, content-type, multipart, 204, success, and error tests.
