import { app, BrowserWindow, ipcMain } from 'electron';
import * as DesktopSDK from '@recallai/desktop-sdk';
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
}

/**
 * Initialize Desktop SDK
 */
async function initializeDesktopSDK() {
  try {
    console.log('🖥️  Initializing Recall.ai Desktop SDK...');

    // Get region from environment or use default
    const region = process.env.RECALL_REGION || 'us-west-2';
    const apiUrl = `https://${region}.recall.ai`;

    console.log(`   API URL: ${apiUrl}`);
    console.log(`   Requesting permissions: accessibility, screen-capture, microphone`);

    // Initialize the SDK with required options
    await DesktopSDK.init({
      apiUrl: apiUrl,
      acquirePermissionsOnStartup: ['accessibility', 'screen-capture', 'microphone'],
      restartOnError: true
    });

    console.log('✅ Desktop SDK initialized successfully');
    console.log('   Monitoring for Zoom and Google Meet windows...');

    // Set up event listeners
    DesktopSDK.addEventListener('meeting-detected', async (evt) => {
      const windowId = evt.window.id;
      const platform = evt.window.platform || 'unknown';

      console.log(`✅ Meeting detected: ${platform} (Window ID: ${windowId})`);

      // Notify renderer
      mainWindow?.webContents.send('meeting-detected', { windowId, platform });

      try {
        // Get upload token from backend
        console.log('📡 Requesting upload token from backend...');
        const uploadToken = await getUploadTokenFromBackend();

        // Start recording
        console.log('🎥 Starting recording...');
        await DesktopSDK.startRecording({
          windowId: windowId,
          uploadToken: uploadToken
        });

        console.log('✅ Recording started successfully');
        mainWindow?.webContents.send('recording-started', { windowId, platform });

      } catch (error) {
        console.error('❌ Error starting recording:', error);
        mainWindow?.webContents.send('recording-error', {
          message: error.message || 'Failed to start recording'
        });
      }
    });

    // Event: SDK state change (recording, idle, etc.)
    DesktopSDK.addEventListener('sdk-state-change', async (evt) => {
      const state = evt.sdk?.state?.code || 'unknown';
      console.log(`🔄 SDK state changed to: ${state}`);

      switch (state) {
        case 'recording':
          console.log('   📹 SDK is recording');
          break;
        case 'idle':
          console.log('   ⏸️  SDK is idle');
          break;
      }
    });

    // Event: Real-time transcript
    DesktopSDK.addEventListener('transcript', (evt) => {
      const transcript = evt.transcript || {};
      console.log(`[TRANSCRIPT] ${transcript.speaker}: ${transcript.text}`);

      // Send to renderer
      mainWindow?.webContents.send('new-transcript', {
        speaker: transcript.speaker || 'Unknown',
        text: transcript.text || '',
        timestamp: transcript.timestamp || new Date().toISOString(),
        isFinal: transcript.is_final !== false
      });
    });

    // Event: Recording ended (meeting ended)
    DesktopSDK.addEventListener('recording-ended', async (evt) => {
      const windowId = evt.window?.id;
      console.log('📤 Recording ended, uploading...');
      mainWindow?.webContents.send('recording-complete', { windowId });

      try {
        await DesktopSDK.uploadRecording({ windowId });
        console.log('✅ Upload initiated');
      } catch (error) {
        console.error('❌ Upload failed:', error);
        mainWindow?.webContents.send('upload-error', {
          message: error.message || 'Upload failed'
        });
      }
    });

    // Event: Upload progress
    DesktopSDK.addEventListener('upload-progress', (evt) => {
      const progress = evt.progress || 0;
      const windowId = evt.window?.id;
      console.log(`📊 Upload progress: ${progress}%`);
      mainWindow?.webContents.send('upload-progress', { windowId, progress });
    });

    // Event: Upload complete
    DesktopSDK.addEventListener('upload-complete', (evt) => {
      const windowId = evt.window?.id;
      console.log('✅ Upload complete');
      mainWindow?.webContents.send('upload-complete', { windowId });
    });

    // Event: Error
    DesktopSDK.addEventListener('error', (evt) => {
      console.error('❌ Desktop SDK error:', evt.error);
      mainWindow?.webContents.send('sdk-error', {
        message: evt.error?.message || 'Desktop SDK error'
      });
    });

    // Notify renderer that SDK is ready
    mainWindow?.webContents.send('sdk-ready');

  } catch (error) {
    console.error('❌ Failed to initialize Desktop SDK:', error);
    mainWindow?.webContents.send('sdk-error', {
      message: error.message || 'Failed to initialize Desktop SDK'
    });
  }
}

/**
 * Get upload token from backend
 */
async function getUploadTokenFromBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recall-desktop/create-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'electron-user', // TODO: Get from actual auth system
        meetingTitle: `Meeting ${new Date().toLocaleString()}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create upload token');
    }

    const { upload } = await response.json();
    console.log('✅ Upload token received:', upload.uploadId);

    return upload.uploadToken;
  } catch (error) {
    console.error('❌ Error getting upload token:', error);
    throw error;
  }
}

/**
 * IPC Handlers
 */

// Manually start recording (if user wants to control it)
ipcMain.handle('start-recording-manual', async (event, { windowId }) => {
  try {
    const uploadToken = await getUploadTokenFromBackend();
    await DesktopSDK.startRecording({
      windowId: windowId,
      uploadToken: uploadToken
    });
    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
});

// Stop recording manually
ipcMain.handle('stop-recording-manual', async (event, { windowId }) => {
  try {
    await DesktopSDK.stopRecording({ windowId });
    return { success: true };
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
});

// Get SDK status
ipcMain.handle('get-sdk-status', async () => {
  return {
    initialized: true,
    ready: true
  };
});

/**
 * App lifecycle
 */

app.whenReady().then(async () => {
  createWindow();

  // Initialize Desktop SDK after a short delay to ensure window is ready
  setTimeout(() => {
    initializeDesktopSDK();
  }, 1000);

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

app.on('will-quit', async () => {
  // Cleanup Desktop SDK
  try {
    console.log('🧹 Cleaning up Desktop SDK...');
    await DesktopSDK.shutdown();
  } catch (error) {
    console.error('Error during SDK cleanup:', error);
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
