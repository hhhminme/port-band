import { Tray, nativeImage } from 'electron'

function renderTrayIconSvg(count, frame) {
  const size = 48
  const cx = size / 2
  const cy = 30

  const flip = count === 0 ? 0 : (frame % 2 === 0 ? -1 : 1)
  const bounce = count === 0 ? 0 : (frame % 2 === 0 ? 0 : 4)

  const hairColor = '#E8485C'
  const headColor = '#FF6B6B'

  let hairPaths = ''
  for (let i = -3; i <= 3; i++) {
    const sx = cx + i * 4
    const sy = cy - 10 + bounce
    const cpx = cx + i * 4 + flip * 8
    const cpy = cy - 24 + Math.abs(i) * 2 + bounce
    const ex = cx + i * 4 + flip * 14
    const ey = cy - 32 + Math.abs(i) * 4 + bounce
    hairPaths += `<path d="M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}" stroke="${hairColor}" stroke-width="3.6" stroke-linecap="round" fill="none"/>`
  }

  const headCy = cy + bounce

  let zzzText = ''
  if (count === 0) {
    zzzText = `
      <text x="36" y="16" fill="#71717a" font-size="14" font-weight="bold" font-family="sans-serif">z</text>
      <text x="40" y="10" fill="#71717a" font-size="10" font-weight="bold" font-family="sans-serif">z</text>
    `
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${hairPaths}
    <circle cx="${cx}" cy="${headCy}" r="12" fill="${headColor}"/>
    <circle cx="${cx - 5}" cy="${headCy - 2}" r="2.4" fill="white"/>
    <circle cx="${cx + 5}" cy="${headCy - 2}" r="2.4" fill="white"/>
    ${zzzText}
  </svg>`
}

function svgToNativeImage(svgString) {
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`
  return nativeImage.createFromDataURL(dataUrl)
}

export function createTray(toggleCallback) {
  const svg = renderTrayIconSvg(0, 0)
  const icon = svgToNativeImage(svg)

  const tray = new Tray(icon)
  tray.setToolTip('PortBand')
  tray.setTitle(' 0')

  tray.on('click', () => {
    toggleCallback()
  })

  return tray
}

export function updateTrayIcon(tray, count, frame) {
  if (!tray || tray.isDestroyed()) return
  try {
    const svg = renderTrayIconSvg(count, frame)
    const icon = svgToNativeImage(svg)
    tray.setImage(icon)
  } catch (e) {
    // Ignore rendering errors
  }
}

export function setTrayTitle(tray, count) {
  if (!tray || tray.isDestroyed()) return
  tray.setTitle(` ${count}`)
}
