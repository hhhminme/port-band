# PortBand — Project Rules

## Overview
macOS menu bar app that monitors TCP listening ports and shows animated cat Lottie characters that headbang faster as more ports are active.

## Tech Stack
- Electron 28+ (electron-vite)
- React 18 + Vite (renderer)
- Tailwind CSS v4 + shadcn/ui style components (dark mode only)
- `@lottiefiles/dotlottie-react` (renderer — cat animation)
- `lottie-web` (main process — tray icon frame pre-rendering)
- electron-store (preferences)
- lsof for port scanning (no sudo needed)

## Core Rules

1. **No emoji icons** — All UI icons must be SVG (Lucide-style inline SVG or Simple Icons paths)
2. **Dark mode only** — Use inline styles to force dark colors on all shadcn/ui components (Card, AlertDialog, etc.) since they may render in light mode by default
3. **No hover interactions** — Action buttons (Open, Copy, Kill) are always visible. No hover-to-reveal patterns.
4. **Security** — `contextIsolation: true`, `nodeIntegration: false`. All IPC via `contextBridge`.
5. **Port scanning** — `lsof -iTCP -sTCP:LISTEN -nP` (macOS built-in, no elevated permissions)
6. **Color tokens** — All colors defined in `src/renderer/src/lib/constants.js`

## Animation Architecture

### Renderer (BandStage + Stickman)
- `.lottie` (dotLottie zip format) loaded via `@lottiefiles/dotlottie-react`
- Import as URL: `import catSrc from '../assets/loader-cat.lottie?url'`
- Speed controlled via `dotLottieRefCallback` → `setSpeed(n)`
- `getBpmSpeed(count)` returns multiplier: 1x (idle) / 3x / 6x / 9x / 12x

### Tray Icon (main process)
- Offscreen `BrowserWindow` (hidden, 36x36) loads self-contained HTML
- `lottie-web` source injected inline via `readFileSync` from node_modules
- Cat animation JSON (`cat-animation.json`) baked into the HTML
- All frames pre-rendered to canvas at startup → cached as `nativeImage` array
- Frames resized to 18x18pt for macOS Retina @2x compatibility
- `updateTrayIcon(tray, count, frame)` cycles through cached frames
- Frame interval controlled by `getTrayFrameInterval(count)`: 500ms (idle) → 20ms (turbo)

### BPM Sync
| Port Count | BPM Label | Renderer Speed | Tray Interval |
|-----------|-----------|---------------|--------------|
| 0         | —         | 1x            | 500ms        |
| 1-2       | ~60       | 3x            | 120ms        |
| 3-4       | ~120      | 6x            | 60ms         |
| 5-7       | ~180      | 9x            | 35ms         |
| 8+        | ~240      | 12x           | 20ms         |

## Design Tokens

```
bg:           #09090b  (zinc-950)
card:         #18181b  (zinc-900)
border:       #27272a  (zinc-800)
text.primary: #fafafa  (zinc-50)
text.secondary: #e4e4e7 (zinc-200)
text.tertiary: #71717a (zinc-500)
text.muted:   #52525b  (zinc-600)
text.ghost:   #3f3f46  (zinc-700)
accent.green: #34d399  (emerald-400)
accent.red:   #ef4444  (red-500)
```

## Project Structure
```
src/main/index.js              — Electron main process + animation loop
src/main/tray.js               — Tray icon (Lottie offscreen rendering)
src/main/cat-animation.json    — Cat Lottie JSON (extracted from .lottie)
src/main/port-scanner.js       — lsof execution + parsing
src/main/preferences.js        — electron-store settings
src/preload/index.js           — contextBridge IPC bridge
src/renderer/src/App.jsx       — Main React component
src/renderer/src/assets/       — loader-cat.lottie (dotLottie for renderer)
src/renderer/src/components/   — BandStage, Stickman, PortRow, etc.
src/renderer/src/lib/          — Icons, constants (getBpmSpeed, getBpmLabel)
```

## Key Lessons & Gotchas

### dotLottie vs Lottie JSON
- `.lottie` files are zip archives (not JSON). Need `@lottiefiles/dotlottie-react` or `@lottiefiles/dotlottie-web` to play them.
- `lottie-react` (based on `lottie-web`) only accepts raw JSON, not `.lottie` zip.
- To use both formats: renderer uses dotLottie, main process uses extracted JSON from the zip.
- Extract JSON: `unzip file.lottie` → `animations/*.json`

### Tray Icon Sizing on macOS
- macOS menu bar icons must be ~18x18pt (36x36px @2x Retina)
- Rendering at larger sizes (48x48) makes icons appear oversized
- Use `nativeImage.resize({ width: 18, height: 18 })` after rendering at 2x

### Offscreen Lottie Rendering in Electron
- CDN loading in offscreen `BrowserWindow` may fail (network/CSP issues)
- Inject `lottie-web` source directly via `readFileSync` + inline `<script>` tag
- Load HTML via `data:text/html;base64,...` data URL
- Set `contextIsolation: false` on the offscreen window (not user-facing)
- Pre-render ALL frames at startup and cache as `nativeImage[]` — avoid per-frame rendering

### Vite + electron-vite Bundling
- `__dirname` in main process resolves to `out/main/` after build
- `readFileSync` with `__dirname`-relative paths works at runtime
- JSON imports (`import x from './file.json'`) are inlined by Vite
- `.lottie` files in renderer: use `?url` suffix for Vite asset URL import

## Commands
- `npm run dev` — Development with HMR
- `npm run build` — Production build
- `npm run build:mac` — Build macOS DMG

## Design References
- `docs/portband-dev-spec.md` — Full technical specification
- `docs/portband-mockup.jsx` — Design mockup (confirmed)
