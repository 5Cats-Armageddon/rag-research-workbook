const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Settings
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: s => ipcRenderer.invoke('save-settings', s),
  detectCloudPaths: () => ipcRenderer.invoke('detect-cloud-paths'),

  // Data
  loadData: syncPath => ipcRenderer.invoke('load-data', syncPath),
  saveData: (data, syncPath) => ipcRenderer.invoke('save-data', data, syncPath),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDefaultDataPath: () => ipcRenderer.invoke('get-default-data-path'),

  // File system
  showOpenDialog: opts => ipcRenderer.invoke('show-open-dialog', opts),
  showSaveDialog: opts => ipcRenderer.invoke('show-save-dialog', opts),
  writeFile: (fp, content) => ipcRenderer.invoke('write-file', fp, content),
  readFile: fp => ipcRenderer.invoke('read-file', fp),
  pathExists: p => ipcRenderer.invoke('path-exists', p),

  // Theme
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  openExternal: url => ipcRenderer.invoke('open-external', url),

  // Native URL fetch
  fetchUrlNative: url => ipcRenderer.invoke('fetch-url-native', url),

  // Ollama
  listOllamaModels: host => ipcRenderer.invoke('list-ollama-models', host),

  // Updates
  checkForUpdate: ({ owner, repo }) => ipcRenderer.invoke('check-for-update', { owner, repo }),
  runUpdateB: ({ repoPath }) => ipcRenderer.invoke('run-update-b', { repoPath }),

  // Events: main → renderer
  on: (channel, cb) => {
    const allowed = [
      'open-settings', 'open-updater', 'new-project', 'add-source',
      'export-chat-md', 'export-json', 'import-json',
      'sync-now', 'toggle-dark-mode', 'dark-mode-changed',
      'update-log', 'update-downloaded'
    ];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (e, ...args) => cb(...args));
    }
  },
  off: (channel, cb) => ipcRenderer.removeListener(channel, cb)
});
