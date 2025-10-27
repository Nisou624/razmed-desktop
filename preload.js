const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Envoyer un message au processus principal
  send: (channel, data) => {
    const validChannels = ['app-quit', 'minimize', 'maximize'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Recevoir un message du processus principal
  receive: (channel, func) => {
    const validChannels = ['update-available', 'update-downloaded'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  // Obtenir la plateforme
  getPlatform: () => process.platform,

  // Obtenir la version
  getVersion: () => require('./package.json').version
});
