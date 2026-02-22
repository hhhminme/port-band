import { app, BrowserWindow, ipcMain, shell, clipboard } from 'electron'
import path from 'path'
import { createTray, updateTrayIcon, setTrayTitle, destroyOffscreenWindow } from './tray'
import { scanPorts, killProcess } from './port-scanner'
import { getPreferences, setPreferences, initPreferences } from './preferences'

let mainWindow = null
let tray = null
let scanInterval = null
let animationInterval = null
let currentPorts = []
let frame = 0

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.setVisibleOnAllWorkspaces(true)

  const loadRenderer = async () => {
    if (process.env.ELECTRON_RENDERER_URL) {
      // Retry loading in case dev server isn't ready yet
      for (let i = 0; i < 10; i++) {
        try {
          await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
          return
        } catch (e) {
          if (i < 9) await new Promise((r) => setTimeout(r, 500))
        }
      }
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }
  loadRenderer()

  mainWindow.on('blur', () => {
    mainWindow.hide()
  })
}

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    const trayBounds = tray.getBounds()
    const windowBounds = mainWindow.getBounds()
    const x = Math.round(trayBounds.x - windowBounds.width / 2 + trayBounds.width / 2)
    const y = trayBounds.y + trayBounds.height
    mainWindow.setPosition(x, y)
    mainWindow.show()
    mainWindow.focus()
  }
}

// Frame interval for campfire tray icon animation
function getTrayFrameInterval(count) {
  if (count === 0) return 1000   // slow ember drift
  if (count <= 2) return 300     // gentle flicker
  if (count <= 4) return 200     // moderate
  if (count <= 7) return 150     // active fire
  return 100                     // vigorous blaze
}

function startAnimation() {
  if (animationInterval) clearInterval(animationInterval)

  const speed = getTrayFrameInterval(currentPorts.length)
  animationInterval = setInterval(() => {
    frame++
    updateTrayIcon(tray, currentPorts.length, frame)
  }, speed)
}

async function startScanning() {
  const prefs = getPreferences()
  const interval = (prefs.scanInterval || 2) * 1000

  if (scanInterval) clearInterval(scanInterval)

  const doScan = async () => {
    try {
      const ports = await scanPorts()
      const prevCount = currentPorts.length
      currentPorts = ports

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ports-update', ports)
      }

      setTrayTitle(tray, ports.length)

      if (ports.length !== prevCount) {
        startAnimation()
      }
    } catch (err) {
      console.error('Scan error:', err)
    }
  }

  await doScan()
  scanInterval = setInterval(doScan, interval)
}

function setupIPC() {
  ipcMain.handle('kill-process', async (_, pid) => {
    await killProcess(pid)
  })

  ipcMain.handle('kill-all', async (_, pids) => {
    await Promise.all(pids.map(killProcess))
  })

  ipcMain.handle('open-browser', (_, port) => {
    shell.openExternal(`http://localhost:${port}`)
  })

  ipcMain.handle('copy-url', (_, port) => {
    clipboard.writeText(`http://localhost:${port}`)
  })

  ipcMain.handle('get-preferences', () => {
    return getPreferences()
  })

  ipcMain.handle('set-preferences', (_, prefs) => {
    setPreferences(prefs)
    startScanning()
    return getPreferences()
  })

}

app.dock?.hide()

app.whenReady().then(async () => {
  initPreferences()
  createWindow()
  tray = await createTray(toggleWindow)
  setupIPC()

  await startScanning()
  startAnimation()
})

app.on('before-quit', async () => {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
  destroyOffscreenWindow()
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})
