# PortParty — Project Rules

## Overview
macOS menu bar app that monitors TCP listening ports and shows pixel art RPG adventurers gathering around a campfire. As more ports become active, more characters arrive and the fire grows brighter.

## Tech Stack
- Electron 28+ (electron-vite)
- React 18 + Vite (renderer)
- Tailwind CSS v4 + shadcn/ui style components (dark mode only)
- Canvas-based pixel art rendering (renderer — campfire scene + characters)
- Offscreen BrowserWindow + canvas (main process — tray icon frame pre-rendering)
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

### Renderer (CampfireScene)
- Canvas-based pixel art drawn at 160x72, CSS-scaled to 320x144 with `image-rendering: pixelated`
- Characters defined as 8x10 pixel grid sprites in `CharacterSprite.js`
- Fire rendered procedurally with pixel-art flame shapes in `CampfireRenderer.js`
- Spark particle system (1px gold dots floating upward)
- Characters positioned in semicircular arc around campfire
- `getCampSpeed(count)` returns animation multiplier
- `getCampState(count)` returns label: "Quiet Camp" / "Active Camp" / "Busy Camp" / "Festival"

### Character Class Mapping (service → RPG class)
| Service | Class | Color |
|---------|-------|-------|
| Node.js | Ranger | `#5FA04E` |
| Python | Wizard | `#3776AB` |
| PostgreSQL | Paladin | `#4169E1` |
| Redis | Rogue | `#FF4438` |
| Docker | Sailor | `#2496ED` |
| Vite | Lightning Mage | `#646CFF` |
| Next.js | Dark Knight | `#555555` |
| Go | Monk | `#00ADD8` |
| Rust | Blacksmith | `#DEA584` |
| Generic | Adventurer | `#71717a` |

### Tray Icon (main process)
- Offscreen `BrowserWindow` (hidden, 36x36) loads self-contained HTML with canvas
- Campfire pixel art drawn programmatically (no external animation libraries)
- 5 intensity levels × 4 frames = 20 frames pre-rendered at startup
- Frames resized to 18x18pt for macOS Retina @2x compatibility
- `updateTrayIcon(tray, count, frame)` selects intensity from count, cycles frames
- Frame interval controlled by `getTrayFrameInterval(count)`: 1000ms (idle) → 100ms (blaze)

### Camp State Sync
| Port Count | Camp State | Tray Interval |
|-----------|-----------|--------------|
| 0         | —         | 1000ms       |
| 1-2       | Quiet Camp | 300ms       |
| 3-4       | Active Camp | 200ms      |
| 5-7       | Busy Camp  | 150ms       |
| 8+        | Festival   | 100ms       |

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
accent.fire:  #FB923C  (orange-400)
accent.ember: #F59E0B  (amber-500)
accent.gold:  #FBBF24  (amber-400)
accent.red:   #ef4444  (red-500)
scene.ground: #292017  (dark warm brown)
scene.flame1: #FF6B00  (outer flame)
scene.flame2: #FFB800  (mid flame)
scene.flame3: #FFF4CC  (inner flame core)
scene.spark:  #FFD700  (sparks)
```

## Project Structure
```
src/main/index.js              — Electron main process + animation loop
src/main/tray.js               — Tray icon (canvas-based campfire rendering)
src/main/port-scanner.js       — lsof execution + parsing
src/main/preferences.js        — electron-store settings
src/preload/index.js           — contextBridge IPC bridge (window.portparty)
src/renderer/src/App.jsx       — Main React component
src/renderer/src/components/CampfireScene.jsx   — Canvas campfire scene
src/renderer/src/components/CampfireRenderer.js — Fire, sparks, glow, ground rendering
src/renderer/src/components/CharacterSprite.js  — Pixel art character definitions
src/renderer/src/components/PortRow.jsx         — Port list row
src/renderer/src/components/Settings.jsx        — Camp Settings page
src/renderer/src/components/LivePulse.jsx       — Amber pulse indicator
src/renderer/src/lib/constants.js               — Colors, getCampSpeed, getCampState
src/renderer/src/lib/icons.jsx                  — SVG icons (Simple Icons + Lucide)
src/mcp/server.mjs                              — MCP server for Claude Code
```

## Key Lessons & Gotchas

### Pixel Art Canvas Rendering
- Draw at low resolution (160x72), CSS-scale up with `image-rendering: pixelated`
- Use integer coordinates and `fillRect` for crisp pixel edges
- Characters are 8x10 pixel grids with color-mapped palette indices

### Tray Icon Sizing on macOS
- macOS menu bar icons must be ~18x18pt (36x36px @2x Retina)
- Rendering at larger sizes (48x48) makes icons appear oversized
- Use `nativeImage.resize({ width: 18, height: 18 })` after rendering at 2x

### Offscreen Canvas Rendering in Electron
- Offscreen `BrowserWindow` with canvas for tray frame generation
- Load HTML via `data:text/html;base64,...` data URL
- Set `contextIsolation: false` on the offscreen window (not user-facing)
- Pre-render ALL frames at startup and cache as `nativeImage[]`

### Vite + electron-vite Bundling
- `__dirname` in main process resolves to `out/main/` after build
- JSON imports (`import x from './file.json'`) are inlined by Vite

## RPG Theme Copy
- Header: "PortParty" + badge "Party of N"
- Footer: "Campfire burning" (active) / "Embers cooling" (idle)
- Empty state: "Camp is quiet..." (shown in campfire scene)
- Kill All: "Break Camp" button → dialog "Break camp?" / "Dismiss all N adventurers?"
- Settings: "Camp Settings"
- IPC bridge: `window.portparty`

## Commands
- `npm run dev` — Development with HMR
- `npm run build` — Production build
- `npm run build:mac` — Build macOS DMG
