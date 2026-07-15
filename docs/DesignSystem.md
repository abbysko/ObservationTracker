# Design System & UX

This document combines the project's design system with UX guidance to keep interface decisions centralized.

## Tone & Feel

The interface should feel:

- Clean
- Friendly
- Confident
- Efficient

Avoid extremes:

- Not corporate
- Not childish

Think: a modern outdoor app rather than a spreadsheet.

## Observation screen priorities

1. Speed — enable rapid repeated tapping
2. Large touch targets — accommodate one-handed use
3. Minimal distractions — keep focus on observation counts
4. Fast repeated tapping — avoid input lag
5. Never require search — lists should be scannable
6. Scrolling is acceptable for long lists

## Accessibility

- Provide VoiceOver labels for all interactive elements
- Respect dynamic type and system font sizing where practical
- Ensure color contrast meets WCAG AA
- Minimum touch target sizes (44x44 points / recommended pixel equivalent)

---

## Color modes

- Support light mode and dark mode
- Use CSS variables for tokens so themes can switch easily

## Tokens / Basics

- Colors defined as CSS variables (primary, background, surface, text, accent)
- Spacing scale (8px baseline)
- Typography: system font stack, clear scale for headings and body

## Visual style

- Rounded corners for interactive elements
- Soft shadows for elevation
- Gentle animation for state changes and sorting moves
- Consistent spacing and alignment
- Touch-first sizing for buttons and grid items

## Implementation notes

- Prefer CSS variables and utility classes; avoid heavy CSS frameworks in Version 1
- Keep animations subtle and performant (use transform/opacity)
- Provide a high-contrast accessible theme variant if needed

## Notes for developers

- Combine UX and design changes in small increments and validate accessibility after each change.
- Use the design tokens (CSS variables) as the source of truth for color and spacing across components.
