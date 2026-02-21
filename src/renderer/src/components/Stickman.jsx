import { useEffect, useRef } from 'react'
import { colors } from '../lib/constants'

export default function Stickman({ index, frame, size = 1 }) {
  const ref = useRef(null)
  const color = colors.stickman.body[index % 8]
  const hair = colors.stickman.hair[index % 8]

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const w = 40 * size
    const h = 60 * size
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    const bounce = frame % 2 === 0 ? 0 : -2 * size
    const arm = frame % 2 === 0 ? 1 : -1
    const cx = w / 2
    const headY = 12 * size + bounce
    const flip = frame % 2 === 0 ? -1 : 1

    // Hair (5 strands)
    ctx.strokeStyle = hair
    ctx.lineWidth = 2 * size
    ctx.lineCap = 'round'
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i * 3 * size, headY - 6 * size)
      ctx.quadraticCurveTo(
        cx + i * 3 * size + flip * 4 * size,
        headY - 14 * size + Math.abs(i) * 2 * size,
        cx + i * 3 * size + flip * 6 * size,
        headY - 18 * size + Math.abs(i) * 3 * size
      )
      ctx.stroke()
    }

    // Head
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx, headY, 7 * size, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(cx - 3 * size, headY - size, 1.5 * size, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 3 * size, headY - size, 1.5 * size, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5 * size
    ctx.beginPath()
    ctx.moveTo(cx, headY + 7 * size)
    ctx.lineTo(cx, headY + 28 * size)
    ctx.stroke()

    // Arms
    ctx.beginPath()
    ctx.moveTo(cx, headY + 14 * size)
    ctx.lineTo(cx - 12 * size, headY + 20 * size + arm * 4 * size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx, headY + 14 * size)
    ctx.lineTo(cx + 12 * size, headY + 20 * size - arm * 4 * size)
    ctx.stroke()

    // Legs
    ctx.beginPath()
    ctx.moveTo(cx, headY + 28 * size)
    ctx.lineTo(cx - 8 * size, headY + 42 * size + arm * 2 * size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx, headY + 28 * size)
    ctx.lineTo(cx + 8 * size, headY + 42 * size - arm * 2 * size)
    ctx.stroke()
  }, [frame, color, hair, size, index])

  return <canvas ref={ref} style={{ width: 40 * size, height: 60 * size }} />
}
