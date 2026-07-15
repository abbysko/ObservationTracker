# Vision

## Project Philosophy

This project is intentionally designed as a high-quality portfolio piece. The primary goals are:

- Excellent software architecture
- Clean user experience
- Thoughtful product design
- Reusable JavaScript UI
- Native iPhone deployment

The project is not intended to maximize features. Every implementation decision should favor:

- Simplicity
- Maintainability
- Readability
- Polish
- Incremental development

over feature count.

## Product Summary

Observation Tracker is an offline-first iPhone application that allows users to record observations of items from predefined or custom lists during individual tracking sessions.

Examples of lists the app can be used with:

- Car makes
- US states
- Bird species
- Dog breeds
- License plates
- Pokémon
- Anything the user creates

The application is intentionally generic — it is a framework for counting observations from arbitrary lists (not a specialized car spotting app).

## Scope

In-scope for Version 1:

- Local (device) storage only (offline-first)
- One active session at a time
- Built-in read-only lists and user-created custom lists
- Fast tap-based observation counts with a lightweight correction UI
- Session save/delete and history browsing

Out of scope for Version 1:

- Accounts or cloud sync
- Aggregate statistics across sessions

## Design Principles

- Offline first
- No accounts
- No cloud
- One active session
- Finished sessions are immutable
- Fast one-handed operation
- Dense but touch-friendly interface
- Browser-first development with a thin native wrapper
- Incremental development only

## Notes / Questions

- We should confirm the canonical list of built-in lists and whether any require special metadata (icons, categories).
- Decide whether built-in lists should be shipped as JSON or seeded into a native store for the wrapper.
