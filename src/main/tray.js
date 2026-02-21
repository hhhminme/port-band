import { Tray, nativeImage, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import catAnimation from './cat-animation.json'

let offscreenWindow = null
let cachedFrames = []
let totalFrames = 0

async function initOffscreenWindow() {
  // Read lottie-web source
  const lottieWebPath = join(
    __dirname,
    '../../node_modules/lottie-web/build/player/lottie.min.js'
  )
  let lottieJs = ''
  try {
    lottieJs = readFileSync(lottieWebPath, 'utf-8')
  } catch (e) {
    console.error('[tray] Failed to read lottie-web:', e.message)
    return
  }

  // Build a self-contained HTML page with lottie-web and animation data baked in
  const animJson = JSON.stringify(catAnimation)
  const html = `<!DOCTYPE html>
<html><head><script>${lottieJs}<\/script></head>
<body>
<div id="c" style="width:36px;height:36px"></div>
<script>
  const anim = lottie.loadAnimation({
    container: document.getElementById('c'),
    animationData: ${animJson},
    renderer: 'canvas',
    loop: false,
    autoplay: false
  });
  anim.addEventListener('DOMLoaded', () => {
    // Re-draw each frame onto a 36x36 output canvas for tray icon
    const srcCanvas = document.querySelector('#c canvas');
    const out = document.createElement('canvas');
    out.width = 36;
    out.height = 36;
    window.__outCtx = out.getContext('2d');
    window.__srcCanvas = srcCanvas;
    window.__outCanvas = out;
    window.__lottieReady = true;
    window.__totalFrames = anim.totalFrames;
    window.__anim = anim;
  });
<\/script>
</body></html>`

  offscreenWindow = new BrowserWindow({
    width: 36,
    height: 36,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false
    }
  })

  await offscreenWindow.loadURL(
    'data:text/html;base64,' + Buffer.from(html).toString('base64')
  )
}

async function renderLottieFrames() {
  if (!offscreenWindow || offscreenWindow.isDestroyed()) return

  // Wait for lottie to be ready
  const ready = await offscreenWindow.webContents.executeJavaScript(`
    new Promise(resolve => {
      if (window.__lottieReady) return resolve(true);
      const check = setInterval(() => {
        if (window.__lottieReady) { clearInterval(check); resolve(true); }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(false); }, 5000);
    })
  `)

  if (!ready) {
    console.error('[tray] Lottie did not become ready in time')
    return
  }

  const frames = await offscreenWindow.webContents.executeJavaScript(`
    (() => {
      const results = [];
      const ctx = window.__outCtx;
      const src = window.__srcCanvas;
      const out = window.__outCanvas;
      for (let i = 0; i < window.__totalFrames; i++) {
        window.__anim.goToAndStop(i, true);
        ctx.clearRect(0, 0, 36, 36);
        ctx.drawImage(src, 0, 0, 36, 36);
        results.push(out.toDataURL('image/png'));
      }
      return results;
    })()
  `)

  console.log('[tray] Rendered', frames.length, 'cat frames')
  cachedFrames = frames.map((dataUrl) => {
    const img = nativeImage.createFromDataURL(dataUrl)
    // Resize to 18x18 so macOS treats the 36px source as @2x Retina
    return img.resize({ width: 18, height: 18 })
  })
  totalFrames = cachedFrames.length
}

export async function createTray(toggleCallback) {
  await initOffscreenWindow()
  try {
    await renderLottieFrames()
  } catch (e) {
    console.error('[tray] renderLottieFrames failed:', e.message)
  }

  const icon =
    cachedFrames.length > 0 ? cachedFrames[0] : nativeImage.createEmpty()

  const tray = new Tray(icon)
  tray.setToolTip('PortBand')
  tray.setTitle(' 0')

  tray.on('click', () => {
    toggleCallback()
  })

  return tray
}

export async function updateTrayIcon(tray, count, frame) {
  if (!tray || tray.isDestroyed()) return
  if (totalFrames === 0) return

  const idx = frame % totalFrames
  const img = cachedFrames[idx]
  if (img) {
    tray.setImage(img)
  }
}

export function setTrayTitle(tray, count) {
  if (!tray || tray.isDestroyed()) return
  tray.setTitle(` ${count}`)
}

export function destroyOffscreenWindow() {
  if (offscreenWindow && !offscreenWindow.isDestroyed()) {
    offscreenWindow.destroy()
    offscreenWindow = null
  }
}
