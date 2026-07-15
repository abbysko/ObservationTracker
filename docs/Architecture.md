# Architecture

## Overview

ObservationTracker v1 is a client-side Single Page Application (SPA) built with vanilla JavaScript, HTML5, and CSS. There is no backend; all data is stored in the browser's `localStorage`.

## Layer Diagram

```
┌──────────────────────────────────────────────────┐
│                   Screens (UI)                   │
│  Home │ LogObservation │ MyObservations │ Map │ Stats │
├──────────────────────────────────────────────────┤
│                  Components (UI)                 │
│  NavBar │ ObservationCard │ Modal │ FilterBar │ Chart │
├──────────────────────────────────────────────────┤
│                   Services                       │
│  ObservationService │ LocationService │ ExportService │
├──────────────────────────────────────────────────┤
│                  Repository                      │
│           ObservationRepository                  │
├──────────────────────────────────────────────────┤
│                  Storage                         │
│               localStorage                      │
└──────────────────────────────────────────────────┘
```

## Module Descriptions

### Screens
Located in `web/screens/`. Each screen is a JavaScript module that exports a `render(container)` function responsible for injecting HTML into the main content area and binding event listeners.

### Components
Located in `web/components/`. Reusable UI fragments used by screens. Each component exports a factory function that returns a DOM element or HTML string.

### Services
Located in `web/services/`. Business logic layer. Services call the repository for data and apply domain rules before returning results to screens.

### Repository
Located in `web/repository/`. Handles all reads and writes to `localStorage`. Serializes/deserializes model objects. Provides simple CRUD operations.

### Models
Located in `web/models/`. Plain JavaScript objects (POJOs) with factory functions. No framework classes.

### Utils
Located in `web/utils/`. Stateless helper functions for date formatting, string manipulation, validation, and geolocation.

### Data
Located in `web/data/`. Static JSON reference files (species lists, category definitions).

## Routing

The app uses hash-based routing (`window.location.hash`). The router in `app.js` maps hash fragments to screen modules and calls their `render()` functions on navigation.

| Route | Screen |
|---|---|
| `#/` or `#/home` | Home |
| `#/log` | LogObservation |
| `#/observations` | MyObservations |
| `#/map` | Map |
| `#/stats` | Statistics |

## Data Flow

1. User triggers action in a Screen
2. Screen calls a Service method
3. Service applies business rules and calls Repository
4. Repository reads/writes localStorage
5. Repository returns model object(s) to Service
6. Service transforms if needed and returns to Screen
7. Screen re-renders the updated portion of the DOM

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Language | Vanilla JS (ES2020) | No build step, no dependencies |
| Styling | Plain CSS with custom properties | Simple, no preprocessor needed |
| Storage | localStorage | Offline, no backend, sufficient for personal data volume |
| Mapping | Leaflet.js (CDN) | Lightweight, open-source, works offline with tiles cached |
| Charts | Chart.js (CDN) | Simple, well-documented, small footprint |
| Icons | Inline SVG | No external font dependency |
