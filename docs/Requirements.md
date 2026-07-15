# Requirements

## Functional Requirements

### Observation Logging
- FR-01: Users can create a new observation with date, time, location, category, species name, count, and notes
- FR-02: Users can attach a photo to an observation (local file pick)
- FR-03: Date and time default to the current moment and are editable
- FR-04: Location can be entered manually (place name) or captured via browser Geolocation API
- FR-05: Category is selected from a predefined list (Birds, Mammals, Reptiles, Amphibians, Insects, Plants, Fungi, Other)
- FR-06: Species name is a free-text field with autocomplete suggestions from local reference data
- FR-07: Count defaults to 1 and must be a positive integer
- FR-08: Notes are optional free text up to 2000 characters

### Observation Management
- FR-09: Users can view a list of all their observations, sorted by date (newest first)
- FR-10: Users can filter observations by category, date range, and location keyword
- FR-11: Users can edit any field of a saved observation
- FR-12: Users can delete an observation with confirmation
- FR-13: Users can search observations by species name or notes keyword

### Map View
- FR-14: Observations with GPS coordinates are shown as pins on a map
- FR-15: Tapping a pin opens observation details
- FR-16: The map starts centered on the user's last recorded location

### Statistics
- FR-17: Users can see total observations count, species count, and active days
- FR-18: Users can see a breakdown by category
- FR-19: Users can see observations per month as a bar chart
- FR-20: Users can see their most-observed species (top 10)

### Data Management
- FR-21: Users can export all observations as JSON
- FR-22: Users can import observations from a previously exported JSON file
- FR-23: Data is persisted in browser localStorage

## Non-Functional Requirements

- NFR-01: The app must work fully offline after initial page load
- NFR-02: The app must load in under 2 seconds on a modern device
- NFR-03: The app must be responsive and usable on screens from 375px to 1440px wide
- NFR-04: The app must not require any user account or authentication
- NFR-05: No observation data is transmitted to any server
- NFR-06: The app must be accessible (WCAG 2.1 AA target)
- NFR-07: The app must work in Chrome, Firefox, Safari, and Edge (latest two versions)

## Out of Scope (v1)

- Cloud sync or backup
- Social / sharing features
- Species identification via AI
- iOS app (planned for v2)
- Push notifications
