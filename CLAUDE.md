# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ScanMed beta preview — a single-file Italian pharmaceutical home-management app. The entire application lives in **`index.html`** (no build step, no package manager, no framework).

Open it directly in a browser: `start index.html` (Windows) or `open index.html` (macOS).

## Commands & workflow

- **No build, no package manager, no automated tests.** The app *is* `index.html`; verification is manual in a browser.
- **Run locally**: `start index.html`. Opening as `file://` renders the UI but **skips the service worker and blocks `navigator.mediaDevices`** — so the camera scanner won't work (see PWA / Scanner sections).
- **Test camera / PWA locally**: needs a secure context — serve over local HTTPS (any HTTPS static server) or use the GitHub Pages deploy.
- **Deploy**: push to `main` → GitHub Pages publishes at `https://chri7ciofi.github.io/beta-scanmed-preview/`, the HTTPS origin that enables `getUserMedia`.

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
| Scheda Tec. | `fetchSchedaTecnica(aic)` (20h cache) · `openSchedaModal()` · `setDocLink()` — FI/RCP docs |
| Router      | `navigate(screenId)` — shows/hides `.screen` divs, calls per-screen `render*()`            |
| Home        | `renderHome()`                                                                             |
| Dispensa    | `renderDispensa()`, `addToDispensa()`, `removeFromDispensa()`, `checkDuplicatePrincipio()` |
| Safety      | `showSafetyAlert()` — blocking modal for duplicate `principio_attivo`                      |
| Scanner     | `initScanner()`, `renderScanResult()` · live camera: `cameraSupported()`, `ensureBarcodeDetector()`, `startCamera()`/`stopCamera()`, `scanLoop()`, `handleScan()` · parsing: `decodeAIC()`, `extractAIC()` |
| Search      | `initSearch()` — 300ms debounce, min 3 chars                                               |
| Cicli       | `renderCure()`, `logDose()`, `adherencePercent()`                                          |
| Modals      | `openModal()` / `closeModal()` + wiring. IDs: `modal-add-drug`, `modal-safety-alert`, `modal-bollino-info`, `modal-scheda`, `modal-add-ciclo`. Generic backdrop-click-to-close covers all `.modal-overlay` |
| Init        | `DOMContentLoaded` — calls `loadState()`, `navigate('home')`, all `init*()`                |

## Data model (localStorage `scanmed_v1`)

```json
{
  "dispensa": [{ "id", "codice_aic", "nome_commerciale", "principio_attivo", "confezione", "foglio_illustrativo_url", "rcp_url", "data_scadenza", "quantita", "lotto" }],
  "cicli":    [{ "id", "farmaco_id", "nome", "orari", "data_inizio", "data_fine", "log": [{ "data", "stato" }] }]
}
```

Second localStorage key `scanmed_scheda_v1` — 20h TTL cache for the Scheda Tecnica feature: `{ [aic]: { foglio_illustrativo_url, rcp_url, cached_at, expires_at } }`. Written by `fetchSchedaTecnica()`.

## Supabase backend

- Project: `wrynjuqskcjqbnrqsegz` (eu-central-1)
- Table: `public.farmaci` — 8,516 rows, RLS enabled with public SELECT
- Columns: `id` (bigint PK) · `codice_aic` (text, unique, 9-digit, zero-padded) · `nome_commerciale` · `principio_attivo` · `confezione` · `foglio_illustrativo_url` (text, nullable) · `rcp_url` (text, nullable)
- AIC lookup: `codice_aic=eq.{9-digit-padded-aic}`
- Text search: `or=(nome_commerciale.ilike.*{q}*,principio_attivo.ilike.*{q}*)` — encode only the query term with `encodeURIComponent`, **not** the `*` wildcards
- **Scheda Tecnica (FI/RCP)**: `fetchByAIC`/`searchFarmaci` also select `foglio_illustrativo_url,rcp_url`. AIFA has **no public API** and direct browser calls are CORS-blocked, so document URLs live in these columns (client-only, no proxy). Only the 4 demo AICs are seeded (with the official AIFA portal URL as placeholder); full population is a separate data-sourcing task — UI degrades to a "non disponibile" empty state when null. PDFs open in a new tab (`X-Frame-Options` blocks iframe embed).

## CSS conventions

- All colors and spacing via CSS variables in `:root`
  - **Primary blues**: `--blue-primary: #1E62EC` (buttons, nav, headers) · `--blue-secondary: #2E70F0` (accents, borders) · `--blue-light: #7BA5F2` (hover states)
  - **Backgrounds**: `--blue-pale: #F0F5FF` (card/dialog backgrounds) · `--cream: #F5F0E8` (main app background)
  - **Text**: `--text-primary: #0A1931` (dark navy headings/body) · `--text-muted: #5A6F8F` (secondary text)
  - **Status**: `--amber: #D4892A` (secondary CTA) · `--red-expired: #C0392B` / `--orange-warn: #E67E22` (expiry warnings)
  - **Premium tokens**: gradients `--grad-blue` / `--grad-amber` / `--grad-surface` / `--grad-app` (use these for headers, nav, primary/amber buttons, card surfaces — not flat fills) · `--hairline` / `--hairline-blue` (1px card borders) · `--ring` (focus-visible) · layered two-stop `--shadow-sm/card/float/deep`
- Expiry status drives CSS class (`safe` / `warning` / `expired`) on `.drug-card` and `.chip` — colors cascade from those classes
- **Stacking gotcha**: `.app-container::before` paints a dot texture at `z-index:0`; `.app-container > .screen` must keep `position:relative; z-index:1` or screen content paints *under* the texture
- **No clipped text**: drug/dose/ciclo name+principio use `overflow-wrap:anywhere`; flex rows (`.drug-row`, `.ciclo-header`, search `.result-info`) need `min-width:0` on the text column; `.chip` / `.qty-badge` are `white-space:nowrap; flex-shrink:0` so labels never wrap or truncate
- Phone frame (390×844px) is stripped to full-bleed at `@media (max-width: 768px)` (status bar hidden); at `@media (min-width: 769px)` the desktop wavy-SVG background + `.desktop-side-text` slogans show (hidden again under 1180px)
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

Strategy: **Code39 only** (`implementazione-scanner.md`). The AIC lives in **Area 1** of the Italian bollino as a Code39 barcode that encodes the AIC in **Code 32 / "Farmacode"** — a 6-char base-32 string over `0123456789BCDFGHJKLMNPQRSTUVWXYZ` (digits + consonants, no vowels), e.g. `0V62VR` → `028511095`. It is **not** the decimal AIC: digit-stripping it gives garbage (the `000000062` bug). DataMatrix (Area 8) and Interleaved 2of5 (Area 6, the serial) are **deliberately not scanned**, so the serial is never decoded.

- **No native `BarcodeDetector` on Windows/Linux desktop Chrome/Edge** — the Shape Detection API ships only on Android/macOS/ChromeOS. The camera button is **always rendered** (no `cameraSupported()` display guard). `ensureBarcodeDetector()` lazily `import()`s the `barcode-detector` polyfill (zxing-wasm) from jsDelivr when the native API is absent. Dynamic `import()` runs inside the existing classic `<script>` — do **not** introduce a build step or `<script type="module">` to support it.
- **Secure context required**: `startCamera()` checks `navigator.mediaDevices` upfront and shows an Italian error message if it's absent (HTTP context). The button is always visible so users on non-HTTPS see the message rather than a missing button.
- **Single-format scanning**: `SCAN_FORMATS = ['code_39']`. On the native API path `ensureBarcodeDetector()` intersects `SCAN_FORMATS` with `getSupportedFormats()` so an unsupported format never breaks construction; when native lacks `code_39` / has no `BarcodeDetector` (desktop Chrome/Edge) it loads the zxing-wasm polyfill via `side-effects.js`. `getUserMedia` requests Full HD (`ideal` 1920×1080) + continuous `focusMode`.
- **Aiming reticle + cropped detection**: the viewfinder shows a wide-short `.vf-reticle` slot (dims outside via a large `box-shadow`) sized for the linear Code39. `scanLoop` crops the source frame to the central band (`createImageBitmap(video, sx, sy, ~90%w, ~30%h)`) so only a barcode framed inside the slot is decoded — any other code outside it is ignored. `object-fit:cover` keeps source centre ↔ box centre aligned.
- **AIC gate**: `scanLoop` logs every detected code then picks the first whose decoded AIC passes `isValidAIC()` (`^0\d{8}$` — a real AIC starts with `0`), so any stray non-AIC Code39 in frame is ignored.
- **AIC-only extraction**: the scanner extracts strictly the AIC. Prefilling of other fields (expiry, lotto) is skipped — `decodeAIC` returns an empty `prefill`.
- `decodeAIC(code)` is the single routing point (reused by `scanLoop` + `handleScan`): `code32ToAic(raw)` (base-32 Farmacode decode) first, falling back to `extractAIC(raw)` for any non-6-char payload (strategy `code39-code32`).
- **`code32ToAic()`** uppercases, strips any char outside the Code32 alphabet (a stray `A`/`*`/separator), and base-32 decodes exactly 6 symbols → `padStart(9,'0')`; returns `''` otherwise so the caller falls back.
- **`extractAIC()` is the decimal-AIC normalizer** (manual entry + any barcode carrying the decimal AIC directly): bare/manual ≤9 digits → `padStart(9,'0')`; NTIN GTIN-13 (`080` + 9-digit AIC + check) → `slice(3,12)`; anything else longer → leading 9 digits `slice(0,9)`. Returns `''` only when there are no digits.
- Camera stream is released in `navigate()` when leaving the scanner screen — preserve this to free the device.

## Key behaviours to preserve

- **Safety gate**: `addToDispensa()` always calls `checkDuplicatePrincipio()` first; it stores a `safetyCallback` and shows the blocking alert — never bypass this
- **AIC padding**: all AIC codes must be `padStart(9, '0')` before querying Supabase
- **Reorder alert**: `logDose()` decrements `farmaco.quantita` and fires a warning toast when it reaches ≤ 3

## Reference docs

- `implementazione-scanner.md` — scanner spec: Code39-only AIC extraction (whitelist Code39, ignore DataMatrix + I2of5 serial). Read before touching scanner logic.
- `PRD-scanmed.md` — product requirements / module spec for the app's screens and flows.
- `graphify-out/` — generated knowledge-graph artifacts (not source code); regenerated via the `/graphify` skill.
