import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react'
import Stickman from './Stickman'
import { getBpmLabel, getBpmSpeed } from '../lib/constants'

// Seed-based deterministic positioning
function seed(i) {
  let s = (i + 1) * 7919
  s = ((s * 1103515245 + 12345) >>> 0) % 1000
  return s / 1000
}

const DraggableStick = memo(function DraggableStick({ index, size, speed, initX, initY }) {
  return (
    <div
      data-stick={index}
      style={{
        position: 'absolute',
        left: initX,
        top: initY,
        cursor: 'grab',
        zIndex: Math.round(initY)
      }}
    >
      <Stickman index={index} size={size} speed={speed} />
    </div>
  )
}, (prev, next) => {
  return prev.index === next.index && prev.size === next.size && prev.speed === next.speed && prev.initX === next.initX && prev.initY === next.initY
})

export default function BandStage({ count }) {
  const stageRef = useRef(null)
  const [showHint, setShowHint] = useState(true)
  const draggingRef = useRef(null) // { el, offsetX, offsetY }

  const sz = useMemo(
    () => (count <= 5 ? 1 : count <= 10 ? 0.8 : count <= 16 ? 0.6 : count <= 24 ? 0.5 : 0.4),
    [count]
  )

  const bpmLabel = useMemo(() => getBpmLabel(count), [count])
  const speed = useMemo(() => getBpmSpeed(count), [count])

  const positions = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: seed(i) * (280 - 40 * sz) + 5,
        y: seed(i + 50) * (144 - 60 * sz - 10) + 5
      })),
    [count, sz]
  )

  // Event delegation: single set of listeners on the stage container
  const onPointerDown = useCallback(
    (e) => {
      // Find the closest [data-stick] ancestor
      const stickEl = e.target.closest('[data-stick]')
      if (!stickEl || !stageRef.current) return
      e.preventDefault()
      setShowHint(false)

      const rect = stageRef.current.getBoundingClientRect()
      const cX = e.touches ? e.touches[0].clientX : e.clientX
      const cY = e.touches ? e.touches[0].clientY : e.clientY
      const elLeft = parseFloat(stickEl.style.left) || 0
      const elTop = parseFloat(stickEl.style.top) || 0

      draggingRef.current = {
        el: stickEl,
        offsetX: cX - rect.left - elLeft,
        offsetY: cY - rect.top - elTop
      }
      stickEl.style.cursor = 'grabbing'
    },
    []
  )

  useEffect(() => {
    const onMove = (e) => {
      const d = draggingRef.current
      if (!d || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      const cX = e.touches ? e.touches[0].clientX : e.clientX
      const cY = e.touches ? e.touches[0].clientY : e.clientY
      const newX = Math.max(0, Math.min(rect.width - 40 * sz, cX - rect.left - d.offsetX))
      const newY = Math.max(0, Math.min(rect.height - 60 * sz, cY - rect.top - d.offsetY))
      d.el.style.left = newX + 'px'
      d.el.style.top = newY + 'px'
      d.el.style.zIndex = Math.round(newY)
    }
    const onUp = () => {
      const d = draggingRef.current
      if (d) {
        d.el.style.cursor = 'grab'
        draggingRef.current = null
      }
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
  }, [sz])

  return (
    <div
      ref={stageRef}
      className="relative overflow-hidden"
      style={{
        height: 144,
        borderRadius: 8,
        border: '1px solid #27272a'
      }}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      {positions.map((pos, i) => (
        <DraggableStick key={i} index={i} size={sz} speed={speed} initX={pos.x} initY={pos.y} />
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
      {showHint && count > 0 && (
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
