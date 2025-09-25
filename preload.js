const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that the renderer process (index.html) can use
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Calls the main process to get the unique tag read from ver.txt.
     * @returns {Promise<string>} The current app tag (e.g., "biscuit-dragon").
     */
    getCurrentTag: () => ipcRenderer.invoke('get-current-tag')
});

