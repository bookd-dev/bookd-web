## Why

`bookd-web` currently has no application code, while the admin UI lives in static backend HTML with inline scripts. A React TypeScript app is needed to make the admin surface maintainable and to reserve a stable web shell for the future reader.

## What Changes

- Create a Vite React TypeScript application in `bookd-web`.
- Add typed API access, auth route guards, shared layout, dialogs, and admin feature modules.
- Migrate the legacy admin workflows into React.
- Add `/reader` as a React route with a placeholder shell for future implementation.
- Add web tests and documentation.

## Capabilities

### New Capabilities

- `react-admin-web-app`: Defines the `bookd-web` React application, routing, API access, and admin workflow requirements.

### Modified Capabilities

None.

## Impact

- Adds npm package metadata, Vite config, TypeScript config, source files, CSS, tests, and docs under `bookd-web/`.
- Requires Node and npm for web development and build verification.
- Does not change the Compose Multiplatform client.
