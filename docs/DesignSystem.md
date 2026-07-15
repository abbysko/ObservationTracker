# Design System

## Color Palette

Custom CSS properties are defined in `:root` in `styles.css`.

### Primary Palette

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#2E7D32` | Primary actions, active nav, accent |
| `--color-primary-light` | `#60AD5E` | Hover states, subtle highlights |
| `--color-primary-dark` | `#005005` | Pressed states |
| `--color-secondary` | `#1565C0` | Links, secondary actions |
| `--color-accent` | `#F57F17` | Log FAB button, highlights |

### Neutral Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#FAFAFA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-border` | `#E0E0E0` | Dividers, input borders |
| `--color-text-primary` | `#212121` | Body text |
| `--color-text-secondary` | `#757575` | Secondary text, labels |
| `--color-text-disabled` | `#BDBDBD` | Disabled state text |

### Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#388E3C` | Success toasts, valid states |
| `--color-error` | `#D32F2F` | Error messages, invalid states |
| `--color-warning` | `#F57C00` | Warning messages |
| `--color-info` | `#1976D2` | Info toasts |

### Category Colors

| Category | Token | Value |
|---|---|---|
| Birds | `--color-cat-birds` | `#1565C0` |
| Mammals | `--color-cat-mammals` | `#6D4C41` |
| Reptiles | `--color-cat-reptiles` | `#558B2F` |
| Amphibians | `--color-cat-amphibians` | `#00838F` |
| Insects | `--color-cat-insects` | `#EF6C00` |
| Plants | `--color-cat-plants` | `#2E7D32` |
| Fungi | `--color-cat-fungi` | `#7B1FA2` |
| Other | `--color-cat-other` | `#546E7A` |

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'Inter', system-ui, sans-serif` | All text |
| `--font-size-xs` | `0.75rem` | Badges, meta |
| `--font-size-sm` | `0.875rem` | Secondary text |
| `--font-size-base` | `1rem` | Body text |
| `--font-size-lg` | `1.125rem` | Card titles |
| `--font-size-xl` | `1.25rem` | Section headings |
| `--font-size-2xl` | `1.5rem` | Page titles |
| `--font-size-3xl` | `2rem` | Hero numbers |

## Spacing Scale

Uses an 8px base unit.

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-8` | `48px` |
| `--space-10` | `64px` |

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Badges, chips |
| `--radius-md` | `8px` | Cards, inputs |
| `--radius-lg` | `12px` | Modals |
| `--radius-full` | `9999px` | Pills, FAB |

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.12)` | Cards at rest |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.15)` | Cards on hover, nav |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,.18)` | Modals, dropdowns |

## Components

### Button

Three variants: `btn-primary`, `btn-secondary`, `btn-ghost`

```html
<button class="btn btn-primary">Save Observation</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-ghost">Delete</button>
```

### Observation Card

```html
<div class="observation-card">
  <span class="category-badge category-badge--birds">Birds</span>
  <h3 class="observation-card__species">American Robin</h3>
  <p class="observation-card__meta">June 12, 2026 · Central Park</p>
</div>
```

### Toast

```html
<div class="toast toast--success" role="alert">Observation saved!</div>
```

### Modal

```html
<div class="modal" role="dialog" aria-modal="true">
  <div class="modal__overlay"></div>
  <div class="modal__content">...</div>
</div>
```
