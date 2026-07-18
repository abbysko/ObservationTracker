# ObservationTracker

ObservationTracker is an offline-first iPhone-focused app (developed browser-first) for recording observations from arbitrary lists.

This repository contains:

- `docs/` — project documentation (vision, requirements, architecture, design, data model, milestones, etc.)
- `web/` — web application code (app shell, components, assets)
- `ios/` — placeholder for iOS wrapper code (added later)

## Getting started (developer quick start)

1. Install dependencies:
   - Run: `npm install`
   - Note: `postinstall` runs `npm run sync:vendor` to copy local runtime bundles into `web/vendor`.
2. Start the web dev server:
   - Using the included npm script (recommended):
     - Run: `npm start` (this runs `npx http-server ./web -c-1 -p 8080`)
   - Or with npx directly: `npx http-server ./web -c-1 -p 8080`
   - Or with Python 3: `python -m http.server 8080 --directory web`
3. Open the app at `http://localhost:8080` (port may vary).

### Testing page routes and view state

- Open a specific tab with `page`:
  - Lists: `http://localhost:8080/?page=lists`
  - Track: `http://localhost:8080/?page=track`
  - History: `http://localhost:8080/?page=history`
- Deep-link Lists detail/items view using `listId`:
  - Example: `http://localhost:8080/?page=lists&listId=builtin-car-makes`
- Deep-link active Track state using `listId`:
  - Example: `http://localhost:8080/?page=track&listId=builtin-car-makes`
- In-app navigation keeps URL state in sync for these flows:
  - Lists detail open/close updates `listId`
  - Track start/end session updates `listId`

### Testing themes / dark mode

- Force dark mode via the URL: `http://localhost:8080/?theme=dark`
- Force light mode via the URL: `http://localhost:8080/?theme=light`
- The selection is persisted to `localStorage` by the demo code. If no explicit theme is set the browser's `prefers-color-scheme` controls the UI.
- In Chrome DevTools you can also emulate `prefers-color-scheme` (open DevTools → Esc → Rendering → Emulate CSS media feature `prefers-color-scheme`).

## Documentation (what's in `docs/` and how to use it)

The `docs/` folder contains the canonical project documentation used to design and implement the app. If you removed or moved any files, this section captures the important parts so the top-level README remains the single source of quick guidance.

Primary documents and where to start:

- Vision.md — project philosophy, product summary, design principles, and scope.
- Requirements.md — functional and non-functional requirements with acceptance criteria.
- Architecture.md — high-level architecture, web-first workflow, native wrapper responsibilities.
- DesignSystem.md — combined UX and design system guidance (tokens, accessibility, visual style).
- DataModel.md — data structures and example JSON for lists, items, and sessions.
- Repository.md — repository interface and persistence implementation notes.
- CodingStandards.md — coding conventions and recommended tooling.
- Milestones.md — incremental milestones that keep the app runnable.
- DecisionLog.md — record of architectural decisions and rationale.
- AIInstructions.md — guardrails for using AI tools on this project.

How to use these docs

1. Read `Vision.md` to understand product goals and constraints.
2. Use `Requirements.md` and `DataModel.md` to implement the core features and persistence.
3. Follow `Architecture.md` and `Repository.md` when implementing storage and the native wrapper.
4. Apply `DesignSystem.md` when building UI components.
5. Follow `Milestones.md` to pick small, runnable increments; each milestone should leave the app runnable.
6. Add entries to `DecisionLog.md` when you make architecture or policy decisions.

## Notes

- Current web persistence implementation uses `localStorage` for custom lists and session context.
- Built-in lists are loaded from `web/data/builtins.json`.
- Repository interfaces and longer-term storage goals are documented in `docs/Repository.md`.
- When ready to wrap for iOS, embed the web build in a minimal SwiftUI app using `WKWebView` and implement a small native repository bridge.

## Contributing

When contributing, please follow the coding standards in `docs/CodingStandards.md` and the milestone-driven workflow. Small, focused commits that keep the app runnable are preferred.
