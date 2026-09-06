const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vm', {
  close: () => ipcRenderer.send('win:close'),
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleTop: () => ipcRenderer.invoke('win:toggleTop'),
  isTop: () => ipcRenderer.invoke('win:isTop')
});
