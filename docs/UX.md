# UX Design

## Design Principles

1. **Speed first** — the most common action (log an observation) must be reachable in one tap and completable in under 30 seconds
2. **Clarity** — labels, icons, and categories should be self-explanatory; no tutorials required
3. **Forgiveness** — all destructive actions (delete) require a confirmation step; edits are always possible
4. **Density balance** — the list view shows enough detail to scan quickly without being cluttered

## Navigation

The app uses a persistent bottom navigation bar on mobile and a top navigation bar on desktop with five destinations:

| Icon | Label | Route |
|---|---|---|
| 🏠 | Home | `#/home` |
| ➕ | Log | `#/log` |
| 📋 | Observations | `#/observations` |
| 🗺️ | Map | `#/map` |
| 📊 | Stats | `#/stats` |

The Log button is center-positioned and visually prominent (larger, accent color).

## Screens

### Home
- Greeting with date
- Quick-log shortcut button
- Today's observation count
- Last 3 observations as cards
- Streak counter (consecutive active days)

### Log Observation
- Form with fields: Date, Time, Category (segmented control), Species, Count, Location, Notes, Photo
- GPS capture button next to Location field
- "Save" button at bottom
- Inline validation with error messages
- After save: show success toast and navigate to My Observations

### My Observations
- Scrollable card list, newest first
- Filter bar: Category chips, Date range, Search input
- Each card shows: species name, category icon, date, location, count, thumbnail
- Swipe-to-delete on mobile (with confirmation)
- Tap card to open detail/edit modal

### Map
- Full-viewport map (Leaflet)
- Pins colored by category
- Cluster markers when zoomed out
- Popup on pin tap with species name, date, thumbnail
- Floating locate-me button

### Statistics
- Summary row: Total observations | Species | Active days
- Category donut chart
- Monthly observations bar chart
- Top-10 species table

## Interaction Patterns

- **Modals** — used for observation detail and delete confirmation; dismissible by tapping outside or pressing Escape
- **Toasts** — brief non-blocking messages for success ("Observation saved") and error states
- **Empty states** — each screen has an illustrated empty state with a clear call-to-action
- **Loading indicators** — spinner shown during async operations (GPS lookup, photo processing)

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 600px | Single column, bottom nav |
| Tablet | 600–1024px | Single column, top nav |
| Desktop | > 1024px | Two-column content area, top nav |

## Accessibility

- All interactive elements have visible focus rings
- Color is never the sole indicator of state
- Icons always have accessible labels (`aria-label` or adjacent text)
- Form fields have associated `<label>` elements
- Modal traps focus while open
- Minimum tap target size: 44×44 px
