# Repository Structure

```
ObservationTracker/
│
├── README.md               Project overview and quickstart
├── LICENSE                 MIT license
├── .gitignore
│
├── docs/                   Project documentation
│   ├── Vision.md           Why the project exists and who it serves
│   ├── Requirements.md     Functional and non-functional requirements
│   ├── Architecture.md     Layer diagram, module descriptions, routing
│   ├── UX.md               Screen designs and interaction patterns
│   ├── DesignSystem.md     Colors, typography, spacing, components
│   ├── DataModel.md        Data schemas and storage details
│   ├── Repository.md       This file — directory map
│   ├── CodingStandards.md  Code style rules and conventions
│   ├── Milestones.md       Planned releases and feature roadmap
│   ├── DecisionLog.md      Architectural and product decisions with rationale
│   └── AIInstructions.md   Instructions for AI coding assistants
│
├── web/                    Web application source
│   ├── index.html          App shell — single HTML file
│   ├── styles.css          Global styles and design tokens
│   ├── app.js              Bootstrap and hash router
│   │
│   ├── models/             Plain data model factories
│   │   ├── Observation.js
│   │   └── Category.js
│   │
│   ├── repository/         localStorage CRUD layer
│   │   └── ObservationRepository.js
│   │
│   ├── services/           Business logic
│   │   ├── ObservationService.js
│   │   ├── LocationService.js
│   │   └── ExportService.js
│   │
│   ├── screens/            Top-level page modules
│   │   ├── HomeScreen.js
│   │   ├── LogObservationScreen.js
│   │   ├── MyObservationsScreen.js
│   │   ├── MapScreen.js
│   │   └── StatsScreen.js
│   │
│   ├── components/         Reusable UI fragments
│   │   ├── NavBar.js
│   │   ├── ObservationCard.js
│   │   ├── ObservationModal.js
│   │   ├── FilterBar.js
│   │   ├── Toast.js
│   │   └── ConfirmDialog.js
│   │
│   ├── utils/              Stateless helpers
│   │   ├── date.js
│   │   ├── validation.js
│   │   └── format.js
│   │
│   ├── data/               Static reference data
│   │   ├── categories.json
│   │   └── species.json
│   │
│   └── assets/             Static assets
│       └── icons/          SVG icons
│
└── ios/                    iOS app (planned — see Milestones.md)
    └── README.md
```
