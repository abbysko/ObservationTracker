# Decision Log

A record of significant product and architecture decisions, with rationale and alternatives considered.

---

## DL-001: Vanilla JS, no framework

**Date**: 2026-06-01  
**Status**: Accepted  
**Decision**: Build the web app with vanilla JavaScript ES2020+, no framework (no React, Vue, etc.)

**Rationale**:
- No build toolchain required; the app opens directly as a local file in a browser
- Reduces dependency surface and eliminates version churn
- The app's interactivity level (screens, forms, lists) is well within vanilla JS capability
- Reduces cognitive overhead for contributors unfamiliar with a specific framework

**Alternatives Considered**:
- React: Adds JSX/bundler complexity for marginal benefit at this scale
- Vue 3 SFC: Requires bundler for SFCs; options API with CDN would work but adds obscure patterns
- Svelte: Requires compilation step

---

## DL-002: localStorage as primary storage

**Date**: 2026-06-01  
**Status**: Accepted  
**Decision**: Use `localStorage` for all observation data

**Rationale**:
- Zero backend required
- Offline-first by default
- Sufficient capacity for typical personal usage (hundreds of observations without photos)
- Simple API

**Alternatives Considered**:
- IndexedDB: More capable (binary data, larger quotas) but significantly more complex API; revisit for photo storage in Milestone 2
- SQLite via WASM: Powerful but heavy; overkill for v1
- Remote backend: Violates no-account and privacy requirements

---

## DL-003: Hash-based routing

**Date**: 2026-06-01  
**Status**: Accepted  
**Decision**: Use `window.location.hash` for client-side routing

**Rationale**:
- Works with `file://` protocol (no server required)
- No server configuration needed for path-based routing
- Trivial to implement without a library

**Alternatives Considered**:
- History API (pushState): Requires a server to serve `index.html` for all paths; breaks `file://` use
- Single-page with scroll-to-section: Poor UX for this app's distinct screen metaphor

---

## DL-004: Leaflet.js for maps

**Date**: 2026-06-01  
**Status**: Accepted  
**Decision**: Use Leaflet.js (loaded from CDN) for the Map screen

**Rationale**:
- Widely used, well-documented, MIT licensed
- Smaller than Google Maps or Mapbox SDK
- Works with OpenStreetMap tiles (no API key needed)

**Alternatives Considered**:
- Google Maps JS API: Requires API key, billing setup
- Mapbox GL JS: Heavier, requires API key for tiles

---

## DL-005: No TypeScript in v1

**Date**: 2026-06-01  
**Status**: Accepted  
**Decision**: Use plain JavaScript with JSDoc annotations for type hints

**Rationale**:
- Avoids build step requirement
- JSDoc provides IDE type-checking and autocomplete without compilation
- Keeps onboarding barrier low

**Alternatives Considered**:
- TypeScript with tsc: Adds `tsconfig.json`, compilation step, and type declaration maintenance
