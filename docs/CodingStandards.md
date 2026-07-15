# Coding Standards

## Language

- Use ES2020+ features (optional chaining, nullish coalescing, `const`/`let`, arrow functions, template literals, destructuring, `async`/`await`)
- No TypeScript in v1 — use JSDoc comments for type hints if needed
- No build step, no bundler — code must run directly in modern browsers without transpilation

## Module System

- Use native ES Modules (`import`/`export`) via `<script type="module">` in `index.html`
- One module per file
- Default export for the primary screen/component/class; named exports for utilities and factories

## File Naming

- **PascalCase** for screen and component files: `HomeScreen.js`, `ObservationCard.js`
- **camelCase** for utility, service, and repository files: `date.js`, `observationService.js`
- **camelCase** for JSON data files: `categories.json`, `species.json`

## Code Style

- 2-space indentation
- Single quotes for strings
- No semicolons (ASI-safe style)
- Maximum line length: 100 characters
- Trailing commas in multi-line arrays and objects

## Functions

- Prefer pure functions in utils
- Keep functions short (< 30 lines); extract helpers for clarity
- Avoid deeply nested callbacks — use `async`/`await`

## DOM Manipulation

- Screens render HTML by setting `innerHTML` of the container element
- After initial render, use `querySelector` within the screen container (not global `document`)
- Bind event listeners after inserting HTML into the DOM
- Clean up event listeners on screen teardown if they are attached to `window` or `document`

## CSS

- Use CSS custom properties (design tokens) from `:root` — do not hardcode colors or sizes
- Use BEM-style class names: `.block`, `.block__element`, `.block--modifier`
- Media queries use `min-width` (mobile-first)
- No `!important`

## Error Handling

- Wrap localStorage operations in try/catch; log errors to `console.error`
- Display user-facing errors via the Toast component, not `alert()`
- Validate inputs before saving (use `web/utils/validation.js`)

## Comments

- Comment the *why*, not the *what*
- JSDoc for exported functions:

```js
/**
 * Creates a new Observation object with a generated id and timestamps.
 * @param {Partial<Observation>} fields
 * @returns {Observation}
 */
export function createObservation(fields) { ... }
```

## Git

- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`
- Each commit should be a logical, working unit of change
- Do not commit `.DS_Store`, editor config, or `node_modules`
