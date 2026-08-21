# Architecture

## Current state

This project is currently a browser-first prototype. The app runs as a static web application, with state persisted in browser storage and the UI split into page-like screens. The native iOS wrapper is a future target, not the present implementation.

- Primary codebase: JavaScript, HTML, and CSS under `/web`
- Current runtime model: static web app served locally in a browser
- Current persistence: browser `localStorage` and `sessionStorage`
- Future target: thin native iOS shell with a WebView and native storage bridge

The architecture is intentionally simple: the UI layer talks to a repository abstraction, while the repository implementation is currently browser-specific and lightweight.

## Directory layout (web)

- `/web/index.html` — app shell and route container
- `/web/styles.css` — base styles, theme tokens, and screen styling
- `/web/app.js` — app bootstrap, theme initialization, and screen routing
- `/web/components` — reusable UI pieces and helper widgets
- `/web/screens` — screen-specific logic and markup for Lists, Track, and History
- `/web/services` — platform-neutral helpers and state logic
- `/web/repository/index.js` — current repository implementation backed by `localStorage`
- `/web/models` — model definitions and schema concepts
- `/web/utils` — shared helper utilities
- `/web/assets` — images, icons, fonts, and static resources
- `/web/data/builtins.json` — seeded built-in list definitions

## Runtime architecture

The application follows a lightweight layered structure:

- App shell: `web/app.js` initializes route state, theme preferences, and the active screen.
- Screen layer: the screen modules render the Lists, Track, and History interfaces and handle user interaction.
- Repository layer: `web/repository/index.js` exposes repository methods such as loading lists, saving custom lists, and storing history entries.
- Storage layer: browser storage (`localStorage` / `sessionStorage`) is the current persistence mechanism.

This keeps the UI logic portable while still being simple enough for a prototype.

## Persistence (current implementation)

The current implementation is intentionally minimal and does not yet use IndexedDB or a native bridge.

- Built-in lists are loaded from `web/data/builtins.json`.
- Custom lists and saved history are stored in `localStorage`.
- Active tracking state is stored in `sessionStorage` while a session is in progress.
- The repository abstraction exists, but it is currently a browser-only implementation rather than a full cross-platform persistence layer.

## Repository pattern

The intended design is already visible in the code:

- UI code calls repository methods instead of reading browser storage directly.
- The repository layer is the boundary between app logic and persistence.
- This makes later replacement with a native-backed implementation more straightforward.

In other words, the repository concept is present and useful, but the implementation remains a lightweight prototype.

## Future native architecture

The following is a planned extension, not the current state:

- Wrap the web app in a minimal iOS shell using SwiftUI and `WKWebView`.
- Expose native persistence through a small bridge to the JavaScript layer.
- Keep the bridge surface narrow: persistence, active-session wake prevention, and small settings/state calls.
- Preserve the existing JS UI logic so the same app can continue to run in browser and native wrappers.

This future architecture is the correct long-term direction, but it is not yet implemented in the repository.

## Build & deployment

Current development flow:

- Run the app with the project’s static dev server (`npm start`)
- Open the browser app at the local dev port
- Treat the repository as a simple prototype persistence layer

Future deployment flow:

- package the web app into a minimal Xcode project
- embed the web view in the iOS shell
- add the native repository and device-specific behavior

## Notes

- The codebase is intentionally lightweight and avoids heavy frameworks in Version 1.
- The repository abstraction is already in place, even though the browser implementation is still simple.
- The native wrapper and storage bridge should be added only after the web app’s behavior is stable and well-tested.
