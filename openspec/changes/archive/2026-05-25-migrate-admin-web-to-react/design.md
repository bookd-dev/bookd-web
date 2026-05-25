## Overview

`bookd-web` becomes a single-page React application. It is developed independently with Vite but built into static files that the backend serves in production.

## Application Structure

- `src/api/`: shared client, domain API wrappers, and response types.
- `src/auth/`: local storage session handling and route guards.
- `src/routes/`: login, setup, reader shell, and admin route entry points.
- `src/admin/`: feature components and hooks for admin workflows.
- `src/components/`: shared dialogs, toast, layout, forms, and loading states.
- `src/test/`: Vitest helpers and focused unit tests.

## Routing

- `/` resolves to an auth-aware redirect.
- `/login` handles login and registration.
- `/setup` handles first-admin creation.
- `/reader` is an authenticated shell for non-admin users and future reader work.
- `/admin/*` is guarded to admin users and hosts the management pages.

## State And UX

- Admin tabs become route-addressable pages.
- Modal state is kept in React state.
- Browser `alert` and `confirm` are replaced by reusable toast and confirm dialog helpers.
- API errors are surfaced through the toast provider.

## Testing

Vitest and Testing Library cover the API client, auth guards, and representative admin mutations. The tests mock `fetch` instead of depending on a running backend.
