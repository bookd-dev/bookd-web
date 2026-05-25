# react-admin-web-app Specification

## Purpose
Define the React admin web application's routing, shared API client behavior, legacy admin feature parity, and focused test expectations.

## Requirements

### Requirement: React routes cover the web shell
The `bookd-web` application SHALL define React routes for login, setup, admin, and reader shell entry points.

#### Scenario: Root route is opened
- **WHEN** a user opens `/`
- **THEN** the application SHALL route the user based on admin setup state, authentication state, and user role.

#### Scenario: Admin route is opened by an admin
- **WHEN** an authenticated admin opens `/admin` or `/admin/*`
- **THEN** the admin layout SHALL render the requested management page.

#### Scenario: Admin route is opened by a non-admin
- **WHEN** an authenticated non-admin opens `/admin`
- **THEN** the application SHALL redirect to `/reader`.

### Requirement: API client preserves backend conventions
The web app SHALL use a typed shared API client for all backend calls.

#### Scenario: JSON request is sent
- **WHEN** a request body is not `FormData`
- **THEN** the client SHALL send JSON with `Content-Type: application/json`.

#### Scenario: Multipart request is sent
- **WHEN** a request body is `FormData`
- **THEN** the client SHALL let the browser set the multipart `Content-Type`.

#### Scenario: Backend returns 204
- **WHEN** the backend returns HTTP 204
- **THEN** the client SHALL return a successful empty result.

### Requirement: Admin feature parity is maintained
The React admin pages SHALL provide the existing management capabilities from the legacy admin HTML.

#### Scenario: Admin manages book sources
- **WHEN** an admin adds, lists, toggles, deletes, browses folders, or scans sources
- **THEN** the application SHALL use the matching backend source, filesystem, and scan APIs.

#### Scenario: Admin manages books
- **WHEN** an admin lists, filters, views, edits, uploads cover art, reparses, or views chapters for books
- **THEN** the application SHALL preserve the backend API behavior and refresh affected views after mutations.

#### Scenario: Admin manages metadata helpers
- **WHEN** an admin manages tags, TXT parse rules, users, invite tokens, or background parsing
- **THEN** the application SHALL provide the same successful and error flows as the legacy admin page.

### Requirement: Web behavior is covered by focused tests
The web app SHALL include focused tests for shared behavior and high-risk admin mutations.

#### Scenario: API client changes
- **WHEN** the shared API client is modified
- **THEN** tests SHALL cover success unwrapping, errors, 204, auth headers, and multipart upload headers.

#### Scenario: Route guard changes
- **WHEN** auth routing changes
- **THEN** tests SHALL cover admin and non-admin route decisions.
