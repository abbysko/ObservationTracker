# Repository

## Current state

The current application uses a lightweight repository layer, but the actual implementation is a browser-only prototype using `localStorage`. The repository boundary exists, and the UI is expected to go through it, but the storage backend is intentionally simple.

## Current repository API

The live browser repository exposes the following methods via `window.repository`:

- `loadLists(): Promise<List[]>`
- `saveList(list: List): Promise<void>`
- `deleteList(listId: string): Promise<void>`
- `duplicateList(list: List): Promise<List>`
- `loadHistory(): Promise<HistoryEntry[]>`
- `saveHistorySession(sessionEntry: object): Promise<object>`
- `renameHistorySession(sessionId: string, nextName: string): Promise<object | null>`
- `deleteHistorySession(sessionId: string): Promise<boolean>`

This code is implemented in `web/repository/index.js` and is the active persistence layer for the current prototype.

## Storage behavior today

The browser implementation currently stores:

- built-in and custom lists in `localStorage` under `ot_lists_v1`
- saved history in `localStorage` under `ot_history_v1`
- active tracking state in `sessionStorage` while a session is running

This is intentionally minimal and aligned with the current milestone-driven prototype. The repository wrapper does not yet use IndexedDB, and no native bridge is present yet.

## Design intent

The long-term design remains as follows:

- UI code should not access storage APIs directly.
- Repository methods should remain the integration boundary between app logic and persistence.
- Different persistence backends can be swapped behind the same API.

This is the correct abstraction for future growth, but the current implementation is a browser-local prototype rather than a fully platform-agnostic persistence layer.

## Future native target

The planned future architecture is:

- browser repository implementation for local prototype/dev use
- native repository implementation for iOS wrapper using SwiftData or equivalent native storage
- a small bridge between JavaScript and native code for persistence and device-specific behavior
- a stable repository API that remains unchanged regardless of storage backend

## Principles

- Keep repository methods small and testable.
- Keep the UI layer agnostic to the underlying storage implementation.
- Use the repository as the boundary for persistence concerns.
- Treat the current `localStorage` repository as a prototype implementation, not the final architecture.

## Summary

The repository abstraction is in place and useful, but the implementation is still intentionally simple. The app currently behaves like a browser-local prototype, while the design direction is toward a more formal cross-platform repository layer with native support later on.
