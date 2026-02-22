import { useRef, useEffect, useMemo, useCallback } from 'react'
import { drawGround, drawLogs, drawFire, drawGlow, updateAndDrawSparks } from './CampfireRenderer'
import { drawCharacter, getCharacterClass } from './CharacterSprite'
import { getCampState } from '../lib/constants'

// Internal canvas resolution (CSS scales to display size via image-rendering: pixelated)
const W = 160
const H = 72

// Fire position
const FIRE_X = Math.floor(W / 2)
const FIRE_Y = Math.floor(H * 0.78)

function getFireIntensity(count) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 7) return 3
  return 4
}

function getCharacterPositions(count) {
  if (count === 0) return []

  const positions = []
  const arcRadius = Math.min(28 + count * 2, 55)
  const startAngle = Math.PI * 0.85
  const endAngle = Math.PI * 0.15
  const angleSpan = startAngle - endAngle

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = startAngle - t * angleSpan
    const x = FIRE_X + Math.cos(angle) * arcRadius - 4
    const y = FIRE_Y - Math.sin(angle) * arcRadius * 0.5 - 12
    positions.push({ x: Math.round(x), y: Math.round(y) })
  }

  return positions
}

export default function CampfireScene({ count, ports = [] }) {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const frameRef = useRef(0)
  const rafRef = useRef(null)

  const intensity = useMemo(() => getFireIntensity(count), [count])
  const campState = useMemo(() => getCampState(count), [count])
  const positions = useMemo(() => getCharacterPositions(count), [count])

  const characters = useMemo(() => {
    return ports.slice(0, count).map((p) => getCharacterClass(p.iconKey))
  }, [ports, count])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, W, H)

    // Layer 1: Glow (behind everything)
    drawGlow(ctx, FIRE_X, FIRE_Y, intensity)

    // Layer 2: Ground
    drawGround(ctx, W, H)

    // Layer 3: Characters (sorted by y for depth)
    const charData = positions.map((pos, i) => ({
      ...pos,
      className: characters[i] || 'adventurer',
      index: i
    }))
    charData.sort((a, b) => a.y - b.y)

    const frame = frameRef.current
    charData.forEach((ch) => {
      drawCharacter(ctx, ch.className, ch.x, ch.y, Math.floor(frame / 15) + ch.index)
    })

    // Layer 4: Logs
    drawLogs(ctx, FIRE_X, FIRE_Y)

    // Layer 5: Fire
    drawFire(ctx, FIRE_X, FIRE_Y, intensity, Math.floor(frame / 8))

    // Layer 6: Sparks
    sparksRef.current = updateAndDrawSparks(
      ctx,
      sparksRef.current,
      FIRE_X,
      FIRE_Y - 2,
      intensity
    )

    frameRef.current++
    rafRef.current = requestAnimationFrame(draw)
  }, [intensity, positions, characters])

  useEffect(() => {
    frameRef.current = 0
    sparksRef.current = []
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <div
      style={{
        position: 'relative',
        height: 144,
        borderRadius: 8,
        border: '1px solid #27272a',
        overflow: 'hidden',
        background: '#0a0a0c'
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated'
        }}
      />
      {campState && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontSize: 10,
            fontWeight: 500,
            color: '#52525b',
            fontFamily: 'monospace'
          }}
        >
          {campState}
        </span>
      )}
      {count === 0 && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            color: '#3f3f46',
            pointerEvents: 'none'
          }}
        >
          Camp is quiet...
        </span>
      )}
    </div>
  )
}
