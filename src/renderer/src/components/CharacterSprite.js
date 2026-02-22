// Pixel art character sprite definitions and rendering
// Each character is an RPG adventurer class mapped from a service type

// Service name → character class
export const SERVICE_TO_CLASS = {
  nodedotjs: 'ranger',
  python: 'wizard',
  uvicorn: 'wizard',
  gunicorn: 'wizard',
  postgresql: 'paladin',
  mysql: 'knight',
  redis: 'rogue',
  docker: 'sailor',
  nginx: 'sentinel',
  vite: 'lightning_mage',
  nextdotjs: 'dark_knight',
  go: 'monk',
  rust: 'blacksmith',
  ruby: 'gem_miner',
  terminal: 'adventurer',
  mongodb: 'paladin',
  express: 'ranger',
  fastify: 'ranger',
  nestjs: 'knight',
  nuxtdotjs: 'sentinel',
  angular: 'knight',
  vuedotjs: 'sentinel',
  openjdk: 'paladin',
  apache: 'sentinel',
  php: 'wizard',
  elixir: 'wizard',
  visualstudiocode: 'lightning_mage'
}

// Color palettes: h=hat, s=skin, p=primary, d=dark
const PALETTES = {
  ranger: { h: '#3D6B32', s: '#F5C6A0', p: '#5FA04E', d: '#2D4A22' },
  wizard: { h: '#1E4D7A', s: '#F5C6A0', p: '#3776AB', d: '#0F2D4A' },
  paladin: { h: '#2A47A1', s: '#F5C6A0', p: '#4169E1', d: '#1A2D6A' },
  knight: { h: '#2D5270', s: '#F5C6A0', p: '#4479A1', d: '#1A3040' },
  rogue: { h: '#B71C1C', s: '#F5C6A0', p: '#FF4438', d: '#7A0E0E' },
  sailor: { h: '#1565C0', s: '#F5C6A0', p: '#2496ED', d: '#0D3B70' },
  sentinel: { h: '#00662B', s: '#F5C6A0', p: '#009639', d: '#003D1A' },
  lightning_mage: { h: '#3F47CC', s: '#F5C6A0', p: '#646CFF', d: '#2A2F8A' },
  dark_knight: { h: '#333333', s: '#F5C6A0', p: '#555555', d: '#1A1A1A' },
  monk: { h: '#007A99', s: '#F5C6A0', p: '#00ADD8', d: '#004D60' },
  blacksmith: { h: '#8B5E3C', s: '#F5C6A0', p: '#DEA584', d: '#5A3A22' },
  gem_miner: { h: '#8B1A1A', s: '#F5C6A0', p: '#CC342D', d: '#5A0E0E' },
  adventurer: { h: '#4A4A50', s: '#F5C6A0', p: '#71717a', d: '#2A2A2E' }
}

// Sprite pixel grids (8 wide × 10 tall)
// . = transparent, h = hat, s = skin, p = primary, d = dark
const SPRITE_SHAPES = {
  default: [
    '..hh....',
    '.hhhh...',
    '..ssss..',
    '..ssss..',
    '.pppppp.',
    '.pppppp.',
    '.pppppp.',
    '.dddddd.',
    '.dd..dd.',
    '.dd..dd.'
  ],
  wizard: [
    '...h....',
    '..hhh...',
    '.hhhhh..',
    '..ssss..',
    '.pppppp.',
    '.pppppp.',
    '.pppppp.',
    '.pppppp.',
    '..pppp..',
    '..dd.dd.'
  ],
  knight: [
    '.hhhhhh.',
    '.hhhhhh.',
    '.hssssh.',
    '..ssss..',
    '.pppppp.',
    '.pppppp.',
    '.pppppp.',
    '.dddddd.',
    '.dd..dd.',
    '.dd..dd.'
  ],
  rogue: [
    '..hhhh..',
    '.hhhhhh.',
    '.hhsshh.',
    '..ssss..',
    '.pppppp.',
    '.pppppp.',
    '.pppppp.',
    '.dddddd.',
    '.dd..dd.',
    '.dd..dd.'
  ]
}

// Map character class → sprite shape
const CLASS_SHAPE = {
  ranger: 'rogue',
  wizard: 'wizard',
  paladin: 'knight',
  knight: 'knight',
  rogue: 'rogue',
  sailor: 'default',
  sentinel: 'default',
  lightning_mage: 'wizard',
  dark_knight: 'knight',
  monk: 'default',
  blacksmith: 'default',
  gem_miner: 'knight',
  adventurer: 'default'
}

export function getCharacterClass(iconKey) {
  return SERVICE_TO_CLASS[iconKey] || 'adventurer'
}

export function drawCharacter(ctx, className, x, y, frame) {
  const palette = PALETTES[className] || PALETTES.adventurer
  const shapeName = CLASS_SHAPE[className] || 'default'
  const shape = SPRITE_SHAPES[shapeName]

  // Idle bob: shift y by 1px on alternating frames
  const bobOffset = frame % 2 === 0 ? 0 : -1

  const colorMap = { h: palette.h, s: palette.s, p: palette.p, d: palette.d }

  for (let row = 0; row < shape.length; row++) {
    const rowStr = shape[row]
    for (let col = 0; col < rowStr.length; col++) {
      const ch = rowStr[col]
      if (ch === '.') continue
      const color = colorMap[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x + col, y + row + bobOffset, 1, 1)
    }
  }
}
