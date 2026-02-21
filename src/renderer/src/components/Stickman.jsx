import { memo, useState, useCallback } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import catSrc from '../assets/loader-cat.lottie?url'

function StickmanInner({ index, size = 1, speed = 1 }) {
  const w = 40 * size
  const h = 60 * size
  const [dotLottie, setDotLottie] = useState(null)

  const refCb = useCallback((instance) => {
    setDotLottie(instance)
  }, [])

  // Update speed when it changes
  if (dotLottie) {
    dotLottie.setSpeed(speed)
  }

  return (
    <DotLottieReact
      dotLottieRefCallback={refCb}
      src={catSrc}
      loop
      autoplay
      speed={speed}
      style={{ width: w, height: h }}
    />
  )
}

export default memo(StickmanInner, (prev, next) => {
  return prev.index === next.index && prev.size === next.size && prev.speed === next.speed
})
