# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ScanMed beta preview — a single-file Italian pharmaceutical home-management app. The entire application lives in **`index.html`** (no build step, no package manager, no framework).

Open it directly in a browser: `start index.html` (Windows) or `open index.html` (macOS).

## Architecture

Everything is in one file, structured top-to-bottom:

1. **`<style>`** — all CSS, using CSS custom properties defined in `:root`
2. **`<body>`** — static HTML skeleton: phone frame → 5 screen divs → bottom nav → 3 modal overlays → toast div
3. **`<script>`** — vanilla JS, no modules, organized into labelled sections:

| Section | Responsibility |
|---|---|
| Config | `SB_URL`, `SB_KEY`, `LS_KEY` constants |
| State | Single `state` object (current screen, dispensa[], cicli[], pending modal data) |
| Utils | `uid()`, `today()`, `getExpiryStatus()`, `daysUntilExpiry()`, `showToast()` |
| Mock data | `seedMockData()` — runs once on first load if `localStorage` key absent |
| Persistence | `loadState()` / `saveState()` — reads/writes `localStorage` key `scanmed_v1` |
| Supabase | `fetchByAIC(aic)` · `searchFarmaci(query)` — raw `fetch()` to PostgREST REST API |
| Router | `navigate(screenId)` — shows/hides `.screen` divs, calls per-screen `render*()` |
| Home | `renderHome()` |
| Dispensa | `renderDispensa()`, `addToDispensa()`, `removeFromDispensa()`, `checkDuplicatePrincipio()` |
| Safety | `showSafetyAlert()` — blocking modal for duplicate `principio_attivo` |
| Scanner | `initScanner()`, `renderScanResult()` |
| Search | `initSearch()` — 300ms debounce, min 3 chars |
| Cicli | `renderCure()`, `logDose()`, `adherencePercent()` |
| Modals | `openModal()` / `closeModal()` + all modal button wiring |
| Init | `DOMContentLoaded` — calls `loadState()`, `navigate('home')`, all `init*()` |

## Data model (localStorage `scanmed_v1`)

```json
{
  "dispensa": [{ "id", "codice_aic", "nome_commerciale", "principio_attivo", "confezione", "data_scadenza", "quantita" }],
  "cicli":    [{ "id", "farmaco_id", "nome", "orari", "data_inizio", "data_fine", "log": [{ "data", "stato" }] }]
}
```

## Supabase backend

- Project: `wrynjuqskcjqbnrqsegz` (eu-central-1)
- Table: `public.farmaci` — 8,516 rows, RLS enabled with public SELECT
- Columns: `id` (bigint PK) · `codice_aic` (text, unique, 9-digit, zero-padded) · `nome_commerciale` · `principio_attivo` · `confezione`
- AIC lookup: `codice_aic=eq.{9-digit-padded-aic}`
- Text search: `or=(nome_commerciale.ilike.*{q}*,principio_attivo.ilike.*{q}*)` — encode only the query term with `encodeURIComponent`, **not** the `*` wildcards

## CSS conventions

- All colors and spacing via CSS variables in `:root`
  - **Primary blues**: `--blue-primary: #1E62EC` (buttons, nav, headers) · `--blue-secondary: #2E70F0` (accents, borders) · `--blue-light: #7BA5F2` (hover states)
  - **Backgrounds**: `--blue-pale: #F0F5FF` (card/dialog backgrounds) · `--cream: #F5F0E8` (main app background)
  - **Text**: `--text-primary: #0A1931` (dark navy headings/body) · `--text-muted: #5A6F8F` (secondary text)
  - **Status**: `--amber: #D4892A` (secondary CTA) · `--red-expired: #C0392B` / `--orange-warn: #E67E22` (expiry warnings)
- Expiry status drives CSS class (`safe` / `warning` / `expired`) on `.drug-card` and `.chip` — colors cascade from those classes
- Phone frame (390×844px) is stripped at `@media (max-width: 430px)` for real mobile
- Modals are bottom-sheets by default; the safety alert uses `.modal-overlay.center` for a centered dialog

## Key behaviours to preserve

- **Safety gate**: `addToDispensa()` always calls `checkDuplicatePrincipio()` first; it stores a `safetyCallback` and shows the blocking alert — never bypass this
- **AIC padding**: all AIC codes must be `padStart(9, '0')` before querying Supabase
- **Reorder alert**: `logDose()` decrements `farmaco.quantita` and fires a warning toast when it reaches ≤ 3
