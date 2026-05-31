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

| Section     | Responsibility                                                                             |
| ----------- | ------------------------------------------------------------------------------------------ |
| Config      | `SB_URL`, `SB_KEY`, `LS_KEY` constants                                                     |
| State       | Single `state` object (current screen, dispensa[], cicli[], pending modal data)            |
| Utils       | `uid()`, `today()`, `getExpiryStatus()`, `daysUntilExpiry()`, `showToast()`                |
| Mock data   | `seedMockData()` — runs once on first load if `localStorage` key absent                    |
| Persistence | `loadState()` / `saveState()` — reads/writes `localStorage` key `scanmed_v1`               |
| Supabase    | `fetchByAIC(aic)` · `searchFarmaci(query)` — raw `fetch()` to PostgREST REST API           |
| Router      | `navigate(screenId)` — shows/hides `.screen` divs, calls per-screen `render*()`            |
| Home        | `renderHome()`                                                                             |
| Dispensa    | `renderDispensa()`, `addToDispensa()`, `removeFromDispensa()`, `checkDuplicatePrincipio()` |
| Safety      | `showSafetyAlert()` — blocking modal for duplicate `principio_attivo`                      |
| Scanner     | `initScanner()`, `renderScanResult()` · live camera: `cameraSupported()`, `ensureBarcodeDetector()`, `startCamera()`/`stopCamera()`, `scanLoop()`, `handleScan()` · parsing: `extractAIC()`, `parseGS1()` |
| Search      | `initSearch()` — 300ms debounce, min 3 chars                                               |
| Cicli       | `renderCure()`, `logDose()`, `adherencePercent()`                                          |
| Modals      | `openModal()` / `closeModal()` + all modal button wiring                                   |
| Init        | `DOMContentLoaded` — calls `loadState()`, `navigate('home')`, all `init*()`                |

## Data model (localStorage `scanmed_v1`)

```json
{
  "dispensa": [{ "id", "codice_aic", "nome_commerciale", "principio_attivo", "confezione", "data_scadenza", "quantita", "lotto" }],
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

## PWA layer

Three files alongside `index.html`:

| File | Purpose |
| ---- | ------- |
| `manifest.json` | App identity, `display: standalone`, `start_url: "./"` (relative — required for GitHub Pages subpath) |
| `sw.js` | Cache strategies: network-only for Supabase, stale-while-revalidate for Google Fonts, cache-first for CDN polyfills + app shell |
| `icons/icon.svg` / `icons/icon-maskable.svg` | White medical cross on `#1E62EC`; maskable variant has no `rx` (full-bleed safe-zone) |

SW registration fires in `DOMContentLoaded` only when `location.protocol !== 'file:'` — opening directly as a local file skips SW (it would fail anyway).

**Deployment**: GitHub Pages at `https://chri7ciofi.github.io/beta-scanmed-preview/` provides the HTTPS context required for `navigator.mediaDevices`.

## Scanner (camera + barcode decoding)

- **No native `BarcodeDetector` on Windows/Linux desktop Chrome/Edge** — the Shape Detection API ships only on Android/macOS/ChromeOS. The camera button is **always rendered** (no `cameraSupported()` display guard). `ensureBarcodeDetector()` lazily `import()`s the `barcode-detector` polyfill (zxing-wasm) from jsDelivr when the native API is absent. Dynamic `import()` runs inside the existing classic `<script>` — do **not** introduce a build step or `<script type="module">` to support it.
- **Secure context required**: `startCamera()` checks `navigator.mediaDevices` upfront and shows an Italian error message if it's absent (HTTP context). The button is always visible so users on non-HTTPS see the message rather than a missing button.
- **AIC-first, multi-format** (SCANNER.md): the only mandatory field is the 9-digit AIC; lotto/expiry are optional. Camera scans `SCAN_FORMATS = ['data_matrix','ean_13','code_128']` — GS1 DataMatrix (new bollini), old IPZS DataMatrix (AIC + serial, non-GS1), and linear EAN-13 / Code128 NTIN codes. On the native API path `ensureBarcodeDetector()` intersects `SCAN_FORMATS` with `getSupportedFormats()` so an unsupported format never breaks construction. `getUserMedia` requests Full HD (`ideal` 1920×1080) + continuous `focusMode` for the sub-millimetre DataMatrix modules.
- `handleScan()` routes by `code.format`: `data_matrix` → `parseGS1()` (AIC + prefill expiry/lotto), falling back to `extractAIC(raw)` for non-GS1 / old IPZS payloads; linear formats → `extractAIC()`. It logs the chosen `strategy` + final AIC. Missing lotto/expiry never blocks the flow — only a digit-less payload yields "Codice non riconosciuto".
- **`extractAIC()` is the single AIC normalization point** — every source converges here. Strict precedence: NTIN GTIN-13 (`080` + 9-digit AIC + check, also the trailing 13 of a GS1 AI `01` GTIN-14) → `slice(3,12)`; bare/manual ≤9 digits → `padStart(9,'0')`; anything longer non-NTIN (old IPZS bollino = AIC + serial) → leading 9 digits `slice(0,9)`. Returns `''` only when there are no digits.
- **GS1 parsing** (`parseGS1`) walks Application Identifiers from the string start — never `indexOf`, which false-matches digits inside the GTIN/AIC. AI `01` GTIN-14, AI `17` expiry `YYMMDD` (if `DD==='00'` → `28`), AI `10` lotto. Non-GS1 DataMatrix yields empty `aic`, so `handleScan` falls back to `extractAIC()`.
- Camera stream is released in `navigate()` when leaving the scanner screen — preserve this to free the device.

## Key behaviours to preserve

- **Safety gate**: `addToDispensa()` always calls `checkDuplicatePrincipio()` first; it stores a `safetyCallback` and shows the blocking alert — never bypass this
- **AIC padding**: all AIC codes must be `padStart(9, '0')` before querying Supabase
- **Reorder alert**: `logDose()` decrements `farmaco.quantita` and fires a warning toast when it reaches ≤ 3
