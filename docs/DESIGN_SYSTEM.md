# CareBridge Design System

## Palette (design tokens)

Defined once as CSS variables in `src/app/globals.css` and mirrored in
`src/config/brand.ts`. Use the `brand-*` Tailwind utilities — never hard-code.

| Token | HEX | Usage |
| ----- | --- | ----- |
| `brand-navy` | `#12304A` | Branding, navigation, headings |
| `brand-teal` | `#0F8B8D` | Primary actions, active nav, progress |
| `brand-green` | `#2E9D68` | Completed learning, verified milestones |
| `brand-coral` | `#F28C75` | Warm accents (use sparingly) |
| `brand-sky` | `#EAF4F7` | Highlighted panels |
| `brand-ivory` | `#FAFAF7` | Light page background |
| `brand-ink` | `#192B3A` | Primary text |
| `brand-slate` | `#64748B` | Secondary text |
| `brand-warning` | `#D97706` | Warning |
| `brand-error` | `#DC4545` | Error |
| `brand-success` | `#218653` | Success |
| `brand-dark` | `#101D2A` | Dark dashboard background |
| `brand-dark-surface` | `#172839` | Dark elevated surface |

Semantic shadcn tokens (`primary`, `secondary`, `muted`, `accent`, `destructive`,
`ring`, `sidebar*`, `chart*`) map onto these values in `:root`, with a `.dark`
override for the dark dashboard theme.

**Colour is never the only signal.** Status is always conveyed with text (the
`StatusBadge` label) as well as colour.

## Typography

Inter (`--font-inter`) for interface text with a system sans fallback;
Geist Mono for numerals/code. Scale:

| Role | Size | Classes |
| ---- | ---- | ------- |
| Display | ~36px | `text-4xl font-semibold` |
| Page title | ~28–32px | `text-2xl font-semibold` |
| Section | ~18–22px | `text-lg font-semibold` |
| Card heading | ~14–16px | `text-base font-medium` |
| Body | ~14–16px | `text-sm` |
| Caption | ~12–13px | `text-xs text-muted-foreground` |

## Logo

Original vector mark: two figures joined by a bridge arch (care + connection).
Files in `public/brand`:

- `logo-mark.svg` — icon only (navy + teal)
- `logo-horizontal.svg` — lockup for light backgrounds
- `logo-horizontal-dark.svg` — lockup for dark backgrounds
- `favicon.svg`, `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`,
  `apple-touch-icon.png`, `social-share.png`

React components in `src/components/brand`:

- `LogoMark` — icon only, size/tone props
- `CareBridgeLogo` — `full` / `stacked` / `icon`, light/dark/mono tones, optional tagline
- `AnimatedCareBridgeLogo` — 5-stage reveal (logo → arch draw → care pulse →
  wordmark → tagline). Respects `prefers-reduced-motion`.

Regenerate PNGs after editing SVGs: `node scripts/generate-brand-assets.mjs`.

## Loading & feedback

- `AppLoadingScreen` — full branded intro (initial load, auth transitions)
- `PageLoadingSkeleton` — lightweight skeleton for table/content refreshes
- `InlineLoadingIndicator` — small inline spinner + label
- `RouteLoadingFallback` — route-segment fallback
- `EmptyState`, `ErrorState`

## Dashboard components

`StatCard`, `MetricCard`, `ProgressCard`, `ChartCard`, `ActionCard`,
`StatusCard`, `AlertCard`, `RecentActivityCard`, `EmptyStateCard`. All support
loading/empty/error states. Exported from `src/components/dashboard`.

## Status model

`src/components/ui/status-badge.tsx` defines `statusToneMap` — the central map
from lifecycle status strings (e.g. `pending`, `eligible`, `paid`, `reversed`)
to a label and tone. Reuse it so status meaning stays consistent platform-wide.

## Motion

Subtle and purposeful: entrance fades, one-shot value/progress animation, gentle
hover elevation. No continuous animation of every card. All motion honours
`prefers-reduced-motion` (global CSS override + `useReducedMotion`).

## Accessibility

Mobile-first; semantic HTML; keyboard navigable; visible focus rings; skip link;
`aria-label`s on icon-only controls; charts/cards provide text alternatives.
Avoid hover-only interactions.
