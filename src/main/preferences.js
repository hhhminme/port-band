import { app } from 'electron'
import Store from 'electron-store'

let store = null

const defaults = {
  openAtLogin: false,
  scanInterval: 2
}

export function initPreferences() {
  try {
    store = new Store({
      name: 'portband-preferences',
      defaults
    })
  } catch (e) {
    console.error('Failed to initialize electron-store:', e)
    store = null
  }
}

export function getPreferences() {
  if (!store) return { ...defaults }
  return {
    openAtLogin: store.get('openAtLogin', defaults.openAtLogin),
    scanInterval: store.get('scanInterval', defaults.scanInterval)
  }
}

export function setPreferences(prefs) {
  if (!store) return
  if (prefs.openAtLogin !== undefined) {
    store.set('openAtLogin', prefs.openAtLogin)
    app.setLoginItemSettings({ openAtLogin: prefs.openAtLogin })
  }
  if (prefs.scanInterval !== undefined) {
    store.set('scanInterval', prefs.scanInterval)
  }
}
