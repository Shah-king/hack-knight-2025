/**
 * TypeScript definitions for Electron API exposed via preload script
 */

export interface MeetingDetected {
  windowId: string;
  platform: 'zoom' | 'google-meet' | string;
}

export interface RecordingStarted {
  windowId: string;
  platform: string;
}

export interface RecordingComplete {
  windowId: string;
}

export interface Transcript {
  speaker: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface UploadProgress {
  windowId: string;
  progress: number;
}

export interface UploadComplete {
  windowId: string;
}

export interface ErrorEvent {
  message: string;
}

export interface SdkStatus {
  initialized: boolean;
  ready: boolean;
}

export interface DetectedMeeting {
  windowId: string;
  platform: string;
  title?: string;
}

declare global {
  interface Window {
    electronAPI: {
      // Event listeners
      onSdkReady: (callback: () => void) => void;
      onMeetingDetected: (callback: (data: MeetingDetected) => void) => void;
      onRecordingStarted: (callback: (data: RecordingStarted) => void) => void;
      onRecordingComplete: (callback: (data: RecordingComplete) => void) => void;
      onNewTranscript: (callback: (transcript: Transcript) => void) => void;
      onUploadProgress: (callback: (data: UploadProgress) => void) => void;
      onUploadComplete: (callback: (data: UploadComplete) => void) => void;
      onRecordingError: (callback: (error: ErrorEvent) => void) => void;
      onUploadError: (callback: (error: ErrorEvent) => void) => void;
      onSdkError: (callback: (error: ErrorEvent) => void) => void;

      // IPC invocations
      getDetectedMeetings: () => Promise<DetectedMeeting[]>;
      startRecording: (windowId: string) => Promise<{ success: boolean }>;
      stopRecording: (windowId: string) => Promise<{ success: boolean }>;
      getSdkStatus: () => Promise<SdkStatus>;

      // Utilities
      isElectron: boolean;
      platform: NodeJS.Platform;
      removeListener: (channel: string) => void;
    };
  }
}

export {};
