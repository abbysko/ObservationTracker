# Requirements

## Overview

This document lists functional and non-functional requirements for ObservationTracker. Each feature below includes a short acceptance description to make the scope actionable for development.

---

## Lists

The application contains two categories of lists:

- Built-in lists (provided by the app)
  - Read-only
  - Cannot be edited in-place
  - Can be duplicated to create a custom editable copy
- Custom lists (created by the user)
  - Create, rename, delete
  - Duplicate
  - Edit items (add / rename / delete)

Acceptance
- A user can view built-in and custom lists. Built-in lists are visually distinct and cannot be edited directly.
- Duplicating a built-in list creates a custom editable copy.

---

## Tracking / Sessions

- Exactly one active session may exist at a time.
- To start a session, the user must select a list.
- While a session is active the user cannot start another session until the current session is saved or discarded.

Session lifecycle acceptance
- Start → Active → Save or Discard
- Saved sessions are immutable (read-only) in history.

---

## Session Metadata

Each saved session MUST include:

- id (UUID)
- displayName (string, editable by user)
- sourceListId (id of the list used)
- createdAt (ISO timestamp)
- endedAt (ISO timestamp)
- duration (computed)
- itemCounts (complete snapshot of counts per item)

Default displayName example: "Car Makes – Jul 15, 2026" (user may rename after session is saved)

---

## Observations (interaction rules)

- Tap on an item: increment its count by exactly 1.
- No free-form numeric entry in Version 1 (no +5, no -3).
- Corrections are performed with a long-press (see Corrections below).

Acceptance
- Taps are fast and reliable; the UI updates immediately and persists to in-memory state.

---

## Corrections (long-press behavior)

- Long-press an item to expand a compact correction UI showing:
  - (−) decrement by 1
  - current count
  - (+) increment by 1
- Only one item can be expanded at a time; tapping elsewhere collapses the expanded view.

Acceptance
- Long-press reliably reveals the correction controls.
- Decrement cannot make the count negative.

---

## Sorting

- Primary sort: observation count (descending)
- Secondary sort: alphabetical (A → Z)
- Resorting is applied after a short delay (approximately 1–2 seconds) after the user stops tapping. The UI should not reflow a button while the user is actively interacting with it.

Acceptance
- Sorting delay prevents jitter during rapid tapping; reordered items animate smoothly when they move.

---

## History

- History stores completed (saved) sessions only.
- Saved sessions are read-only. Users may delete sessions from history.
- History can be filtered by source list.
- Version 1 does not provide aggregate statistics across sessions.

Acceptance
- Saved sessions preserve the full item set and counts (missing observations treated as zero).

---

## Navigation

Three primary tabs:

- Lists — browse built-in and custom lists
- Track — start and run a session
- History — view saved sessions

Track tab states:
- Before session: list picker + Start Tracking button
- During session: tracking interface (item grid, counts, correction UI)

---

## Phone behavior

- During an active session, the app prevents auto-lock (keeps the device awake).
- When no session is active, normal iOS lock behavior applies.

---

## Non-functional requirements

- Offline-first: all core features work without network connectivity.
- Performance: tap interactions must remain responsive during rapid input.
- Accessibility: minimum touch targets, voiceover-friendly labels, and color contrast.

---

## Open questions

- Do built-in lists need icons or extra metadata for display? If yes, define the schema.
- Confirm persistence mechanism for the native wrapper (SwiftData vs bridged IndexedDB).
