// Campfire rendering: fire, glow, sparks, ground, logs

const LOG_COLOR = '#5C3D1E'
const LOG_DARK = '#3D2510'

export function drawGround(ctx, width, height) {
  const startY = Math.floor(height * 0.7)
  for (let y = startY; y < height; y++) {
    const t = (y - startY) / (height - startY)
    const r = Math.round(41 * (1 - t * 0.4))
    const g = Math.round(32 * (1 - t * 0.4))
    const b = Math.round(23 * (1 - t * 0.4))
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, y, width, 1)
  }
}

export function drawLogs(ctx, cx, cy) {
  // Two crossed logs
  ctx.fillStyle = LOG_COLOR
  for (let i = -6; i <= 6; i++) {
    ctx.fillRect(cx + i, cy + Math.round(i * 0.25), 2, 2)
    ctx.fillRect(cx + i, cy - Math.round(i * 0.25), 2, 2)
  }
  ctx.fillStyle = LOG_DARK
  for (let i = -5; i <= 5; i++) {
    ctx.fillRect(cx + i, cy + Math.round(i * 0.25) + 1, 1, 1)
  }
}

function getFlamePixels(intensity, frameIdx) {
  if (intensity === 0) return []

  const pixels = []
  const h = [0, 5, 8, 12, 16][intensity]
  const w = [0, 2, 3, 5, 7][intensity]

  const seed = frameIdx * 7919

  for (let row = 0; row < h; row++) {
    const t = row / h
    const rowW = Math.max(1, Math.round(w * (1 - t * t)))
    const flicker = Math.round(Math.sin(seed * 0.3 + row * 0.7) * 1.5)

    for (let col = -rowW; col <= rowW; col++) {
      const dist = Math.abs(col) / (rowW || 1)
      let color
      if (dist < 0.3 && t < 0.5) color = '#FFF4CC'
      else if (dist < 0.6 && t < 0.7) color = '#FFB800'
      else color = '#FF6B00'

      // Skip some outer pixels for organic shape
      const rng = ((seed + row * 10 + col + 12345) >>> 0) % 100
      if (dist > 0.7 && rng > 55) continue

      pixels.push({ x: col + flicker, y: -row, color })
    }
  }

  return pixels
}

export function drawFire(ctx, cx, cy, intensity, frame) {
  if (intensity === 0) {
    // Embers
    const embers = [[-2, 0], [0, -1], [2, 0], [-1, 1], [1, 1]]
    embers.forEach(([ox, oy], i) => {
      ctx.fillStyle = (frame + i) % 3 === 0 ? '#FF6B00' : '#B34700'
      ctx.fillRect(cx + ox, cy + oy, 1, 1)
    })
    return
  }

  const pixels = getFlamePixels(intensity, frame % 4)
  pixels.forEach(({ x, y, color }) => {
    ctx.fillStyle = color
    ctx.fillRect(cx + x, cy + y, 1, 1)
  })
}

export function drawGlow(ctx, cx, cy, intensity) {
  if (intensity === 0) return

  const radius = Math.round(15 + intensity * 12)

  for (let r = radius; r > 0; r -= 2) {
    const alpha = (0.02 + intensity * 0.02) * (1 - r / radius)
    ctx.fillStyle = `rgba(255, 147, 41, ${alpha})`
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
}

export function createSpark(cx, cy) {
  return {
    x: cx + (Math.random() - 0.5) * 6,
    y: cy - Math.random() * 3,
    dx: (Math.random() - 0.5) * 0.3,
    dy: -0.3 - Math.random() * 0.5,
    life: 1,
    decay: 0.015 + Math.random() * 0.025
  }
}

export function updateAndDrawSparks(ctx, sparks, cx, cy, intensity) {
  const alive = []

  for (const s of sparks) {
    s.x += s.dx
    s.y += s.dy
    s.life -= s.decay
    s.dx += (Math.random() - 0.5) * 0.05

    if (s.life > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${s.life})`
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)
      alive.push(s)
    }
  }

  if (intensity > 0 && Math.random() < intensity * 0.15) {
    alive.push(createSpark(cx, cy))
  }

  return alive
}
