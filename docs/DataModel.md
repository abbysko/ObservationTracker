# Data Model

This document describes the core data structures persisted by the application.

## List

A List represents a collection of items the user can observe.

Fields:
- id: string (UUID)
- name: string
- builtIn: boolean (true for bundled lists)
- items: array of Item objects

Example:
```json
{
  "id": "uuid-list-123",
  "name": "Car Makes",
  "builtIn": true,
  "items": [ /* Item objects */ ]
}
```

## Item

Fields:
- id: string (UUID)
- name: string

Example:
```json
{
  "id": "uuid-item-abc",
  "name": "Toyota"
}
```

## Session

A Session captures a single tracking run.

Fields:
- id: string (UUID)
- listId: string (source list id)
- listSnapshot: full snapshot of the list (items and metadata) at session start
- displayName: string (editable by user after save)
- startedAt: ISO timestamp
- endedAt: ISO timestamp
- duration: number (seconds, computed)
- counts: array of { itemId: string, count: number }

Example:
```json
{
  "id": "uuid-session-1",
  "listId": "uuid-list-123",
  "listSnapshot": { /* items array and metadata */ },
  "displayName": "Car Makes – Jul 15, 2026",
  "startedAt": "2026-07-15T12:00:00Z",
  "endedAt": "2026-07-15T12:10:00Z",
  "duration": 600,
  "counts": [ { "itemId": "uuid-item-abc", "count": 3 } ]
}
```

## Notes

- Saved sessions must preserve the full item set; missing observations are treated as zero.
- Built-in lists are immutable; editing a built-in list should create a custom copy (new id).
