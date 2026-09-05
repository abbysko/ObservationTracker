# Loglist

Loglist is an offline-first iPhone-focused app (developed browser-first) for recording observations from arbitrary lists.

This repository contains:

- `docs/` — project documentation (requirements, architecture, data model, repository)
- `web/` — web application code (app shell, components, assets)
- `ios/` — placeholder for iOS wrapper code (added later)

## Getting started (developer quick start)

1. Install dependencies:
   - Run: `npm install`
   - `npm install` also runs `postinstall` to sync vendor bundles into `vendor`.
2. Start the web dev server: `npm start`.
3. Open the landing page at `http://localhost:8080` (port may vary).
4. Open the app at `http://localhost:8080/app.html`.

### Design system preview

- Open the design system reference page at `http://localhost:8080/design-system.html`.

### Testing page routes and view state

- Open a specific tab with `page`:
  - Lists: `http://localhost:8080/?page=lists`
  - Track: `http://localhost:8080/?page=track`
  - History: `http://localhost:8080/?page=history`
- Open a specific list in the detail view using `page=lists` and `listId`:
  - Example: `http://localhost:8080/?page=lists&listId=builtin-car-makes`
- Open an active tracking session for a specific list using `page=track` and `listId`:
  - Example: `http://localhost:8080/?page=track&listId=builtin-car-makes`

### Testing themes / dark mode

- Force dark mode via the URL: `http://localhost:8080/?theme=dark`
- Force light mode via the URL: `http://localhost:8080/?theme=light`
- The selection is persisted to `localStorage` by the demo code. If no explicit theme is set the browser's `prefers-color-scheme` controls the UI.

## Documentation (what's in `docs/`)

- Requirements.md — functional and non-functional requirements.
- Architecture.md — high-level architecture, web-first workflow, native wrapper responsibilities.
- DataModel.md — data structures and example JSON for lists, items, and sessions.
- Repository.md — repository interface and persistence implementation notes.

## Notes

- Current web persistence implementation uses `localStorage` for custom lists and session context.
- Built-in lists are loaded from `web/data/builtins.json`.
- Repository interfaces and longer-term storage goals are documented in `docs/Repository.md`.
- When ready to wrap for iOS, embed the web build in a minimal SwiftUI app using `WKWebView` and implement a small native repository bridge.
