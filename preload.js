const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stor', {
  dragStart: () => ipcRenderer.invoke('drag-start'),
  drag: () => ipcRenderer.send('drag'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  chain: () => ipcRenderer.send('chain'),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  onDrop: (cb) => ipcRenderer.on('drop', (_e, d) => cb(d)),
  onSwing: (cb) => ipcRenderer.on('swing', () => cb()),
});
