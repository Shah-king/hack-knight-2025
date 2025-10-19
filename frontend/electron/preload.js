import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script - IPC Bridge between Main Process and Renderer
 *
 * This script exposes safe IPC methods to the renderer process (React app)
 * while maintaining security through contextIsolation.
 */

// Expose Electron API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Event Listeners (Main → Renderer)
   */

  // Desktop SDK ready
  onSdkReady: (callback) => {
    ipcRenderer.on('sdk-ready', () => callback());
  },

  // Meeting detected
  onMeetingDetected: (callback) => {
    ipcRenderer.on('meeting-detected', (event, data) => callback(data));
  },

  // Recording started
  onRecordingStarted: (callback) => {
    ipcRenderer.on('recording-started', (event, data) => callback(data));
  },

  // Recording complete
  onRecordingComplete: (callback) => {
    ipcRenderer.on('recording-complete', (event, data) => callback(data));
  },

  // New transcript received
  onNewTranscript: (callback) => {
    ipcRenderer.on('new-transcript', (event, transcript) => callback(transcript));
  },

  // Upload progress
  onUploadProgress: (callback) => {
    ipcRenderer.on('upload-progress', (event, data) => callback(data));
  },

  // Upload complete
  onUploadComplete: (callback) => {
    ipcRenderer.on('upload-complete', (event, data) => callback(data));
  },

  // Errors
  onRecordingError: (callback) => {
    ipcRenderer.on('recording-error', (event, error) => callback(error));
  },

  onUploadError: (callback) => {
    ipcRenderer.on('upload-error', (event, error) => callback(error));
  },

  onSdkError: (callback) => {
    ipcRenderer.on('sdk-error', (event, error) => callback(error));
  },

  /**
   * IPC Invocations (Renderer → Main)
   */

  // Get detected meetings
  getDetectedMeetings: async () => {
    return await ipcRenderer.invoke('get-detected-meetings');
  },

  // Manually start recording
  startRecording: async (windowId) => {
    return await ipcRenderer.invoke('start-recording-manual', { windowId });
  },

  // Manually stop recording
  stopRecording: async (windowId) => {
    return await ipcRenderer.invoke('stop-recording-manual', { windowId });
  },

  // Get SDK status
  getSdkStatus: async () => {
    return await ipcRenderer.invoke('get-sdk-status');
  },

  /**
   * Utilities
   */

  // Check if running in Electron
  isElectron: true,

  // Platform info
  platform: process.platform,

  // Remove listeners (for cleanup)
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that preload script has loaded
console.log('✅ Electron preload script loaded');
console.log('   Platform:', process.platform);
console.log('   Electron API exposed to window.electronAPI');
