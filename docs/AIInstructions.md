# AI Instructions

Instructions for AI coding assistants (GitHub Copilot, Cursor, etc.) working on this codebase.

## Project Context

ObservationTracker is a client-side SPA for logging nature observations. It uses vanilla JavaScript ES2020+, plain CSS, and localStorage. There is no build step, no bundler, and no backend. See `Architecture.md` for the full layer diagram.

## Code Conventions

- Follow all rules in `CodingStandards.md`
- Use 2-space indentation, single quotes, no semicolons
- Prefer `const` over `let`; never use `var`
- Use `async`/`await` instead of `.then()` chains
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate

## File Patterns

- Each screen exports a default `render(container)` function
- Each component exports a factory function that returns an HTML string or DOM element
- The repository layer (`web/repository/`) handles all localStorage access
- Services (`web/services/`) contain business logic only — no DOM, no localStorage direct access
- Utils (`web/utils/`) contain pure functions only

## Styling Rules

- Use CSS custom properties from the `:root` block in `styles.css`
- Never hardcode color values — always reference a `--color-*` token
- Use BEM naming: `.block`, `.block__element`, `.block--modifier`
- Do not add `!important`

## What NOT to Do

- Do not add npm packages or a `package.json`
- Do not add a build/bundle step
- Do not use `document.write()`
- Do not use jQuery or other DOM libraries
- Do not store sensitive user data; do not add any analytics or tracking code
- Do not add backend endpoints or fetch calls to external APIs (except map tile CDN and species CDN if approved)

## Testing

Currently there is no automated test suite. Manual testing is done by opening `web/index.html` in a browser. When adding functionality, verify:
1. The happy path works as expected
2. Validation rejects invalid inputs with a clear error message
3. The UI is usable at 375px viewport width
4. No JavaScript errors appear in the browser console

## Adding a New Screen

1. Create `web/screens/MyNewScreen.js` with a default-exported `render(container)` function
2. Add the route in `app.js` router map
3. Add the nav item in `web/components/NavBar.js`
4. Document any new data fields in `docs/DataModel.md`

## Adding a New Component

1. Create `web/components/MyComponent.js`
2. Export a factory function: `export function myComponent(props) { return '<html string>' }`
3. Import and use it in the relevant screen

## Commit Messages

Use Conventional Commits format:
- `feat: add photo attachment to observation form`
- `fix: prevent duplicate observations on double-tap`
- `docs: update DataModel.md with photoDataUrl field`
- `chore: update categories.json with new species list`
