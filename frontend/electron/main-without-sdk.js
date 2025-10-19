import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const API_BASE_URL = 'http://localhost:3001';

/**
 * Create the main Electron window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    titleBarStyle: 'default',
    backgroundColor: '#ffffff'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Electron app window created');
  console.log('   Mode:', isDev ? 'Development' : 'Production');
  console.log('   URL:', isDev ? 'http://localhost:8080' : 'dist/index.html');
}

/**
 * IPC Handlers (for future Desktop SDK integration)
 */

ipcMain.handle('get-detected-meetings', async () => {
  console.log('ℹ️  get-detected-meetings called (Desktop SDK not initialized)');
  return [];
});

ipcMain.handle('start-recording-manual', async (event, { windowId }) => {
  console.log('ℹ️  start-recording-manual called (Desktop SDK not initialized)');
  throw new Error('Desktop SDK not initialized');
});

ipcMain.handle('stop-recording-manual', async (event, { windowId }) => {
  console.log('ℹ️  stop-recording-manual called (Desktop SDK not initialized)');
  throw new Error('Desktop SDK not initialized');
});

ipcMain.handle('get-sdk-status', async () => {
  return {
    initialized: false,
    ready: false
  };
});

/**
 * App lifecycle
 */

app.whenReady().then(async () => {
  createWindow();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Electron App Started Successfully!                      ║');
  console.log('║                                                           ║');
  console.log('║  Desktop SDK: DISABLED                                    ║');
  console.log('║  Reason: Module compatibility issues                      ║');
  console.log('║                                                           ║');
  console.log('║  You can still use the Bot API feature for recording!    ║');
  console.log('║                                                           ║');
  console.log('║  See DESKTOP_SDK_TROUBLESHOOTING.md for solutions        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});
