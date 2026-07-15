# Data Model

## Overview

All data is stored in `localStorage` as JSON strings. There are two storage keys:

| Key | Contents |
|---|---|
| `ot_observations` | Array of Observation objects |
| `ot_settings` | User settings object |

## Observation

The primary entity.

```json
{
  "id": "obs_1718200000000_abc123",
  "createdAt": "2026-06-12T09:30:00.000Z",
  "updatedAt": "2026-06-12T09:30:00.000Z",
  "date": "2026-06-12",
  "time": "09:30",
  "category": "birds",
  "species": "American Robin",
  "count": 2,
  "location": {
    "name": "Central Park, New York",
    "lat": 40.7851,
    "lng": -73.9683
  },
  "notes": "Two robins foraging on the lawn near the Reservoir.",
  "photoDataUrl": null
}
```

### Field Definitions

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Format: `obs_{timestamp}_{random6}` |
| `createdAt` | ISO 8601 string | yes | Set on creation |
| `updatedAt` | ISO 8601 string | yes | Updated on every edit |
| `date` | `YYYY-MM-DD` string | yes | Observation date |
| `time` | `HH:MM` string | yes | Observation local time |
| `category` | CategoryId string | yes | One of the defined category ids |
| `species` | string | yes | Free text, 1–200 chars |
| `count` | positive integer | yes | Default 1 |
| `location.name` | string | no | Human-readable place name |
| `location.lat` | number | no | Decimal degrees |
| `location.lng` | number | no | Decimal degrees |
| `notes` | string | no | Max 2000 chars |
| `photoDataUrl` | base64 data URL | no | Max ~2 MB after encoding |

## Category

Defined in `web/data/categories.json`.

```json
{
  "id": "birds",
  "label": "Birds",
  "icon": "🐦",
  "colorToken": "--color-cat-birds"
}
```

### Available Categories

| id | label | icon |
|---|---|---|
| `birds` | Birds | 🐦 |
| `mammals` | Mammals | 🦊 |
| `reptiles` | Reptiles | 🦎 |
| `amphibians` | Amphibians | 🐸 |
| `insects` | Insects | 🦋 |
| `plants` | Plants | 🌿 |
| `fungi` | Fungi | 🍄 |
| `other` | Other | 🔭 |

## Settings

```json
{
  "defaultCategory": "birds",
  "unitSystem": "metric",
  "mapTileProvider": "osm"
}
```

## Storage Size Estimate

Typical observation without photo: ~500 bytes. With a compressed photo: ~200–500 KB. localStorage limit is 5–10 MB per origin, so photos should be discouraged for large collections. A future enhancement could store photos in IndexedDB.

## ID Generation

```js
function generateId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `obs_${ts}_${rand}`;
}
```

## Export Format

The JSON export wraps the observations array:

```json
{
  "exportedAt": "2026-06-15T14:00:00.000Z",
  "version": "1",
  "observations": [ /* array of Observation objects */ ]
}
```
