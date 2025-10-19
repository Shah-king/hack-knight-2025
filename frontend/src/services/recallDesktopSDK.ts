/**
 * Recall.ai Desktop SDK Integration
 *
 * This service wraps the @recall.ai/desktop-sdk library for screen and audio recording.
 *
 * Installation:
 *   npm install @recallai/desktop-sdk
 *
 * Documentation:
 *   https://docs.recall.ai/docs/desktop-sdk
 */

// Note: Install the package first: npm install @recall.ai/desktop-sdk
// Uncomment the import below after installing:
// import { RecallDesktopClient } from "@recall.ai/desktop-sdk";

// Type definitions for the Desktop SDK
interface RecallDesktopClientConfig {
  sessionId: string;
  apiKey: string;
  region: string;
}

interface RecordingOptions {
  video?: boolean;
  audio?: boolean;
}

interface RecallDesktopClient {
  startRecording(options: RecordingOptions): Promise<void>;
  stopRecording(): Promise<void>;
  getRecordingStatus(): Promise<{ isRecording: boolean }>;
}

// Desktop SDK client instance
let client: RecallDesktopClient | null = null;

/**
 * Initialize and start Desktop SDK recording
 *
 * @param config - Session credentials from backend
 * @returns Promise that resolves when recording starts
 *
 * @example
 * const session = await startDesktopSession({ userId: 'user123' });
 * await startRecording(session);
 */
export async function startRecording(
  config: RecallDesktopClientConfig,
  options: RecordingOptions = { video: true, audio: true }
): Promise<void> {
  if (client) {
    throw new Error(
      "Recording already in progress. Stop the current recording first."
    );
  }

  try {
    // Initialize Desktop SDK client
    client = new RecallDesktopClient({
      sessionId: config.sessionId,
      apiKey: config.apiKey,
      region: config.region,
    });

    console.log("🎥 Initializing Desktop SDK...");
    console.log("   Session ID:", config.sessionId);
    console.log("   Region:", config.region);
    console.log("   Video:", options.video);
    console.log("   Audio:", options.audio);

    // Start recording screen and/or audio
    await client.startRecording({
      video: options.video ?? true,
      audio: options.audio ?? true,
    });

    console.log("✅ Desktop recording started successfully");
  } catch (error) {
    console.error("❌ Failed to start Desktop SDK recording:", error);
    client = null;
    throw error;
  }
}

/**
 * Stop Desktop SDK recording
 *
 * @returns Promise that resolves when recording stops
 *
 * @example
 * await stopRecording();
 */
export async function stopRecording(): Promise<void> {
  if (!client) {
    console.warn("No active recording to stop");
    return;
  }

  try {
    await client.stopRecording();
    client = null;
    console.log("✅ Desktop recording stopped");
  } catch (error) {
    console.error("❌ Failed to stop Desktop SDK recording:", error);
    throw error;
  }
}

/**
 * Check if recording is currently active
 *
 * @returns True if recording is in progress
 */
export function isRecording(): boolean {
  return client !== null;
}

/**
 * Get recording status from Desktop SDK
 *
 * @returns Recording status
 */
export async function getRecordingStatus(): Promise<{ isRecording: boolean }> {
  if (!client) {
    return { isRecording: false };
  }

  try {
    return await client.getRecordingStatus();
  } catch (error) {
    console.error("❌ Failed to get recording status:", error);
    return { isRecording: false };
  }
}

/**
 * Request screen recording permissions
 * This is required on some platforms before recording can start
 *
 * @returns Promise that resolves when permissions are granted
 */
export async function requestScreenRecordingPermissions(): Promise<boolean> {
  try {
    // Browser APIs for screen capture permissions
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    // Stop the stream immediately - we just needed to trigger permission prompt
    stream.getTracks().forEach((track) => track.stop());

    console.log("✅ Screen recording permissions granted");
    return true;
  } catch (error) {
    console.error("❌ Screen recording permissions denied:", error);
    return false;
  }
}

/**
 * Request microphone permissions
 *
 * @returns Promise that resolves when permissions are granted
 */
export async function requestMicrophonePermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Stop the stream immediately
    stream.getTracks().forEach((track) => track.stop());

    console.log("✅ Microphone permissions granted");
    return true;
  } catch (error) {
    console.error("❌ Microphone permissions denied:", error);
    return false;
  }
}
