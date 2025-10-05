const { app, BrowserWindow } = require('electron');
const path = require('path');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (_) {
    console.log('Electron-reload not available in production');
  }
}

// Set environment for development
if (process.argv.includes('--dev')) {
  process.env.NODE_ENV = 'development';
}
