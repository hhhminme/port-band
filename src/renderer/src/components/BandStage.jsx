import { useState, useEffect, useRef } from 'react'
import Stickman from './Stickman'
import { getBpmLabel } from '../lib/constants'

function DraggableStick({ index, frame, size, initX, initY, stageRef }) {
  const [pos, setPos] = useState({ x: initX, y: initY })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onDown = (e) => {
    e.preventDefault()
    dragging.current = true
    const rect = stageRef.current.getBoundingClientRect()
    const cX = e.touches ? e.touches[0].clientX : e.clientX
    const cY = e.touches ? e.touches[0].clientY : e.clientY
    offset.current = { x: cX - rect.left - pos.x, y: cY - rect.top - pos.y }
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      const cX = e.touches ? e.touches[0].clientX : e.clientX
      const cY = e.touches ? e.touches[0].clientY : e.clientY
      setPos({
        x: Math.max(0, Math.min(rect.width - 40 * size, cX - rect.left - offset.current.x)),
        y: Math.max(0, Math.min(rect.height - 60 * size, cY - rect.top - offset.current.y))
      })
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [size, stageRef])

  return (
    <div
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        zIndex: Math.round(pos.y)
      }}
    >
      <Stickman index={index} frame={frame + index} size={size} />
    </div>
  )
}

export default function BandStage({ count, frame }) {
  const stageRef = useRef(null)
  const [showHint, setShowHint] = useState(true)

  // Seed-based deterministic positioning
  const seed = (i) => {
    let s = (i + 1) * 7919
    s = ((s * 1103515245 + 12345) >>> 0) % 1000
    return s / 1000
  }

  const n = Math.min(count, 8)
  const sz = n > 5 ? 0.8 : 1
  const bpmLabel = getBpmLabel(count)

  return (
    <div
      ref={stageRef}
      className="relative overflow-hidden"
      style={{
        height: 144,
        borderRadius: 8,
        border: '1px solid #27272a'
      }}
      onMouseDown={() => setShowHint(false)}
    >
      {[...Array(n)].map((_, i) => (
        <DraggableStick
          key={i}
          index={i}
          frame={frame}
          size={sz}
          initX={seed(i) * (260 - 40 * sz) + 10}
          initY={seed(i + 50) * (70 - 60 * sz) + 10}
          stageRef={stageRef}
        />
      ))}
      {bpmLabel && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 500,
            color: '#52525b'
          }}
        >
          {bpmLabel} BPM
        </span>
      )}
      {showHint && n > 0 && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            color: '#3f3f46',
            pointerEvents: 'none',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          drag to rearrange
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
