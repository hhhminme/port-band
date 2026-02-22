const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('portparty', {
  onPortsUpdate: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('ports-update', handler)
    return () => ipcRenderer.removeListener('ports-update', handler)
  },
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  killAll: (pids) => ipcRenderer.invoke('kill-all', pids),
  openInBrowser: (port) => ipcRenderer.invoke('open-browser', port),
  copyUrl: (port) => ipcRenderer.invoke('copy-url', port),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs)
})
