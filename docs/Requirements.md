# Introduction

## Vision

Loglist is an iPhone application that allows users to record observations of items from predefined or custom lists during individual tracking sessions. The project was inspired by playing the "license plate game" with my kids, where we wanted to track which US states' license plates we observed on a drive. However the vision for the app is to provide something more generic - more of a framework for counting observations from arbitrary lists, not a specialized car spotting app. This project is intentionally designed as a high-quality portfolio piece.

## Scope

In-scope:

- Local (device) storage only
- One active session at a time
- Built-in read-only lists and user-created custom lists
- Fast, tap-based observation counts
- Simple stats for each session

Out of scope:

- Accounts or cloud sync
- Aggregate statistics across sessions

# Requirements

## Lists

- [Implemented] Built-in lists are provided by the app.
- [Implemented] Built-in lists are read-only and cannot be edited in place.
- [Implemented] Built-in lists can be duplicated to create editable custom copies.
- [Implemented] Custom lists can be created.
- [Implemented] Custom lists can be renamed and deleted.
- [Implemented] Custom lists can be duplicated.
- [Implemented] Items can be added to custom lists, named/renamed, and deleted.
- [Implemented] Users can view built-in and custom lists, and built-ins are visually distinct.

## Sessions

- [Implemented] Exactly one active session may exist at a time.
- [Implemented] Each session is associated with one list.
- [Implemented] To start a session, the user must select a list.
- [Implemented] While a session is active the user cannot start another session.
- [Partial] A session may only be ended by the user selecting to save or discard it.
  - Note: currently users must save a session to end it, but the session may be deleted after save in the History view.
- [Implemented] Users can view saved sessions with distinguishing details such as name and time saved.
- [Implemented] Users can rename a session either during tracking or after it is saved.
- [Discarded] Saved sessions are immutable (read-only).
  - Note: I decided to allow users to "restart" a saved session and modify it from there.
- [Implemented] For each saved session, users can view the observations that were recorded.

## Tracking

- [Implemented] User may quickly tap and item to increment its observation count.
- [Implemented] User may clearly see observation counts and quickly distinguish items with observations from those with zero observations.
- [Implemented] Users may add items to the current list during tracking.
  - NOTE: as implemented, the app allows adding items to built-in lists - these are duplicated to create custom lists to which the new item is added.
- [Partial] Users may decrement observation counts to remedy mistaken observations.
  - NOTE: as implemented, the app currently provides only an undo action with a history of the last 10 observations.

## Non-functional Requirements

- [Partial] Data persistence should be handled through a dedicated interface that can support different backend models, e.g. browser storage versus an iOS-native store.
- [Partial] Tap interactions and screen updates should feel immediate and remain smooth during normal use.
- [Partial] The UI should remain usable on small phones and larger screens without breaking the main flows.
- [Partial] Accessibility should include clear labels, adequate touch targets, good contrast, and screen-reader-friendly controls where applicable.
- [Partial] The app should handle storage failures, missing assets, and save errors gracefully.
- [Implemented] Theme selection should persist, follow system preference when unset, and support explicit light/dark overrides.
