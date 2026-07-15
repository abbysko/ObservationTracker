# Architecture

## Overview

Development begins as a browser-first web application. The web app is later wrapped in a thin native iOS shell (Swift/SwiftUI) that hosts the web UI in a WebView.

- Primary codebase: JavaScript/HTML/CSS under `/web`
- Native wrapper responsibilities (iOS):
  - App navigation shell
  - Persistence adapter (bridge to native storage)
  - Preventing device sleep during active session
  - App lifecycle events and settings UI
  - Hosting the WebView (WKWebView)

Everything else (UI, business logic) remains in JavaScript so the same codebase can power both web and native builds.

## Directory layout (web)

- `/web/index.html` — app shell
- `/web/styles.css` — base styles and design tokens
- `/web/app.js` — app entry point and bootstrapping
- `/web/components` — UI components
- `/web/screens` — top-level screens (Lists, Track, History)
- `/web/services` — platform-agnostic services (timers, sorting)
- `/web/repository` — repository interfaces and browser implementation
- `/web/models` — data models and types
- `/web/utils` — utilities and helpers
- `/web/assets` — images, icons, fonts
- `/web/data` — seeded built-in lists (JSON)

## Persistence

- Browser implementation: IndexedDB (via a small wrapper for typed access)
- Native implementation: SwiftData or an equivalent native storage, exposed to the JS layer via a bridge
- Repository pattern: UI code interacts with a repository interface, not storage APIs directly

## Inter-process communication / Bridge

- Use a simple message-based bridge between JS and native (postMessage / message handlers).
- Keep bridge surface small — implement only what native must do (persistence, prevent sleep, settings).

## Build & Deployment

- Start with a simple static dev server for the web app.
- For iOS, build a minimal Xcode project that embeds the web build and provides a repository implementation.

## Notes

- Prefer small, focused modules and avoid heavy frameworks in Version 1.
- Keep the native bridge stable and testable; most logic should remain in JS to maximize portability.
