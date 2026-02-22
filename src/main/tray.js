import { Tray, nativeImage, BrowserWindow } from 'electron'

let offscreenWindow = null
let cachedFrames = {} // { intensity: [nativeImage, ...] }

function getFireIntensity(count) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 7) return 3
  return 4
}

async function initOffscreenWindow() {
  const html = `<!DOCTYPE html>
<html><head></head><body>
<canvas id="c" width="36" height="36"></canvas>
<script>
window.__generateFrames = function() {
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var result = {};

  for (var intensity = 0; intensity < 5; intensity++) {
    result[intensity] = [];
    for (var f = 0; f < 4; f++) {
      ctx.clearRect(0, 0, 36, 36);
      drawCampfire(ctx, 18, 20, intensity, f);
      result[intensity].push(canvas.toDataURL('image/png'));
    }
  }
  return result;
};

function drawCampfire(ctx, cx, cy, intensity, frame) {
  // Logs
  ctx.fillStyle = '#5C3D1E';
  for (var i = -7; i <= 7; i++) {
    ctx.fillRect(cx + i, cy + Math.round(i * 0.25) + 6, 2, 2);
    ctx.fillRect(cx + i, cy - Math.round(i * 0.25) + 6, 2, 2);
  }
  ctx.fillStyle = '#3D2510';
  for (var i = -6; i <= 6; i++) {
    ctx.fillRect(cx + i, cy + Math.round(i * 0.25) + 7, 1, 1);
  }

  if (intensity === 0) {
    var embers = [[-3, 5], [0, 4], [3, 5], [-1, 6], [2, 6]];
    for (var e = 0; e < embers.length; e++) {
      ctx.fillStyle = (frame + e) % 3 === 0 ? '#FF6B00' : '#B34700';
      ctx.fillRect(cx + embers[e][0], cy + embers[e][1], 2, 2);
    }
    return;
  }

  var heights = [0, 6, 10, 14, 20];
  var widths = [0, 3, 4, 6, 8];
  var h = heights[intensity];
  var w = widths[intensity];
  var seed = frame * 7919;

  for (var row = 0; row < h; row++) {
    var t = row / h;
    var rowW = Math.max(1, Math.round(w * (1 - t * t)));
    var flicker = Math.round(Math.sin(seed * 0.3 + row * 0.7) * 1.5);

    for (var col = -rowW; col <= rowW; col++) {
      var dist = Math.abs(col) / (rowW || 1);
      if (dist < 0.3 && t < 0.5) ctx.fillStyle = '#FFF4CC';
      else if (dist < 0.6 && t < 0.7) ctx.fillStyle = '#FFB800';
      else ctx.fillStyle = '#FF6B00';

      var rng = ((seed + row * 10 + col + 12345) >>> 0) % 100;
      if (dist > 0.7 && rng > 55) continue;

      ctx.fillRect(cx + col * 2 + flicker, cy - row * 2 + 4, 2, 2);
    }
  }

  if (intensity >= 3) {
    for (var s = 0; s < intensity - 1; s++) {
      var sx = cx + Math.round(Math.sin(frame * 2.1 + s * 3.7) * (w + 2));
      var sy = cy - h * 2 + 4 - s * 3 - (frame % 3);
      if (sy > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  }
}
<\/script></body></html>`

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

async function renderCampfireFrames() {
  if (!offscreenWindow || offscreenWindow.isDestroyed()) return

  const framesData = await offscreenWindow.webContents.executeJavaScript(
    'window.__generateFrames()'
  )

  for (let intensity = 0; intensity < 5; intensity++) {
    cachedFrames[intensity] = framesData[intensity].map((dataUrl) => {
      const img = nativeImage.createFromDataURL(dataUrl)
      return img.resize({ width: 18, height: 18 })
    })
  }

  const total = Object.values(cachedFrames).reduce((s, a) => s + a.length, 0)
  console.log('[tray] Rendered', total, 'campfire frames (5 intensities x 4 frames)')
}

export async function createTray(toggleCallback) {
  await initOffscreenWindow()
  try {
    await renderCampfireFrames()
  } catch (e) {
    console.error('[tray] renderCampfireFrames failed:', e.message)
  }

  const icon = cachedFrames[0]?.[0] || nativeImage.createEmpty()

  const tray = new Tray(icon)
  tray.setToolTip('PortParty')
  tray.setTitle(' 0')

  tray.on('click', () => {
    toggleCallback()
  })

  return tray
}

export function updateTrayIcon(tray, count, frame) {
  if (!tray || tray.isDestroyed()) return

  const intensity = getFireIntensity(count)
  const frames = cachedFrames[intensity]
  if (!frames || frames.length === 0) return

  const idx = frame % frames.length
  const img = frames[idx]
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
