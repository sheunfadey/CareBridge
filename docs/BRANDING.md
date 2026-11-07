# CareBridge brand system

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Primary navy | `#102B5C` | Primary surfaces, headings |
| Deep navy | `#071A3A` | Dark backgrounds, loader |
| Primary blue | `#087FE5` | Primary actions and links |
| Bright blue | `#08B7F0` | Accents and highlights |
| Primary green | `#20C840` | `Bridge` wordmark and care accents |
| Deep green | `#078B38` | Success and deep accents |
| Light green | `#EAF8EE` | Soft backgrounds |
| Light background | `#F7FAFC` | App background |
| Primary text | `#172B4D` | Body text |
| Secondary text | `#64748B` | Muted text |
| Border | `#E2E8F0` | Borders and dividers |

The CSS tokens live in `src/app/globals.css`; the shared colours live in
`src/config/brand.ts`.

## Logo assets

`public/brand/` contains the vector logo family, favicon and app icons:

- `carebridge-logo.svg`, `carebridge-logo-dark.svg`, `carebridge-logo-light.svg`
- `carebridge-icon.svg`, `carebridge-wordmark.svg`
- `favicon.svg`, `logo-mark.svg`, `logo-horizontal.svg`
- `icon-16.png`, `icon-32.png`, `icon-192.png`, `icon-512.png`
- `apple-touch-icon.png`, `pwa-192.png`, `pwa-512.png`
- `carebridge-logo.png`, `social-share.png`

`src/app/favicon.ico` and `public/favicon.ico` are generated from the icon.

## Components

- `LogoEmblem` — the shared vector emblem.
- `LogoMark` — icon-only mark.
- `CareBridgeLogo` — full, stacked, icon, light and dark variants.
- `AnimatedCareBridgeLogo` — staged entrance animation.
- `CareBridgeLoader` — full-screen navy loading scene.
- `AppLoadingScreen` / `RouteLoadingFallback` — contained loading states.

The hero uses the animated logo, and `src/app/loading.tsx` uses the full-screen
loader. The dashboard keeps its compact skeleton loader during navigation.
