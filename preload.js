const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to interact with the main process
contextBridge.exposeInMainWorld('electronAPI', {
    // Data operations
    loadData: () => ipcRenderer.invoke('load-data'),
    refreshData: () => ipcRenderer.invoke('refresh-data'),
    
    // File operations
    exportData: (data) => ipcRenderer.invoke('export-data', data),
    
    // App operations
    showNotification: (message, type) => ipcRenderer.invoke('show-notification', message, type),
    
    // Development
    isDev: process.env.NODE_ENV === 'development'
});
