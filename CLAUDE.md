# PortBand — Project Rules

## Overview
macOS menu bar app that monitors TCP listening ports and shows headbanging stickman animations.

## Tech Stack
- Electron 28+ (electron-vite)
- React 18 + Vite (renderer)
- Tailwind CSS v4 + shadcn/ui style components (dark mode only)
- Canvas 2D API (stickman + tray icon)
- electron-store (preferences)
- lsof for port scanning (no sudo needed)

## Core Rules

1. **No emoji icons** — All UI icons must be SVG (Lucide-style inline SVG or Simple Icons paths)
2. **Dark mode only** — Use inline styles to force dark colors on all shadcn/ui components (Card, AlertDialog, etc.) since they may render in light mode by default
3. **No hover interactions** — Action buttons (Open, Copy, Kill) are always visible. No hover-to-reveal patterns.
4. **Security** — `contextIsolation: true`, `nodeIntegration: false`. All IPC via `contextBridge`.
5. **Port scanning** — `lsof -iTCP -sTCP:LISTEN -nP` (macOS built-in, no elevated permissions)
6. **Color tokens** — All colors defined in `src/renderer/src/lib/constants.js`

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
src/main/index.js          — Electron main process
src/main/tray.js           — Tray icon + Canvas animation
src/main/port-scanner.js   — lsof execution + parsing
src/main/preferences.js    — electron-store settings
src/preload/index.js       — contextBridge IPC bridge
src/renderer/src/App.jsx   — Main React component
src/renderer/src/components/ — UI components
src/renderer/src/lib/      — Icons, constants
```

## Commands
- `npm run dev` — Development with HMR
- `npm run build` — Production build
- `npm run build:mac` — Build macOS DMG

## Design References
- `docs/portband-dev-spec.md` — Full technical specification
- `docs/portband-mockup.jsx` — Design mockup (confirmed)
