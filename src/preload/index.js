const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('portband', {
  onPortsUpdate: (callback) => {
    ipcRenderer.on('ports-update', (_, data) => callback(data))
  },
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  killAll: (pids) => ipcRenderer.invoke('kill-all', pids),
  openInBrowser: (port) => ipcRenderer.invoke('open-browser', port),
  copyUrl: (port) => ipcRenderer.invoke('copy-url', port),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs)
})
