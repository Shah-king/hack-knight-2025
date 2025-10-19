import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AudioOutputService - Manages audio files for bot speech output
 *
 * This service handles:
 * - Storing TTS audio files temporarily
 * - Serving audio files for Recall.ai Output Media API
 * - Managing audio sessions per bot
 * - Cleaning up old audio files
 * 
 */
class AudioOutputService {
  constructor() {
    this.audioDir = path.join(__dirname, '..', '..', 'temp', 'audio');
    this.audioSessions = new Map(); // botId -> { audioFile, timestamp, text }

    // Ensure audio directory exists
    this.ensureAudioDir();

    // Clean up old audio files every 10 minutes
    setInterval(() => this.cleanupOldFiles(), 10 * 60 * 1000);
  }

  /**
   * Ensure audio directory exists
   */
  async ensureAudioDir() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      console.log('📁 Audio output directory ready:', this.audioDir);
    } catch (error) {
      console.error('Error creating audio directory:', error);
    }
  }

  /**
   * Save audio for a bot session
   *
   * @param {string} botId - Bot ID
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} text - Text that was converted to speech
   * @returns {Promise<string>} Audio file path
   */
  async saveAudio(botId, audioBuffer, text) {
    const timestamp = Date.now();
    const filename = `${botId}-${timestamp}.mp3`;
    const filepath = path.join(this.audioDir, filename);

    await fs.writeFile(filepath, audioBuffer);

    // Store session info
    this.audioSessions.set(botId, {
      audioFile: filename,
      filepath,
      timestamp,
      text,
    });

    console.log(`🔊 Audio saved for bot ${botId}: ${filename}`);
    return filename;
  }

  /**
   * Get audio file path for a bot
   *
   * @param {string} botId - Bot ID
   * @returns {string|null} File path or null if not found
   */
  getAudioPath(botId) {
    const session = this.audioSessions.get(botId);
    return session ? session.filepath : null;
  }

  /**
   * Get audio file buffer for a bot
   *
   * @param {string} botId - Bot ID
   * @returns {Promise<Buffer|null>} Audio buffer or null
   */
  async getAudioBuffer(botId) {
    const filepath = this.getAudioPath(botId);
    if (!filepath) return null;

    try {
      return await fs.readFile(filepath);
    } catch (error) {
      console.error(`Error reading audio file for bot ${botId}:`, error);
      return null;
    }
  }

  /**
   * Clear audio session for a bot
   *
   * @param {string} botId - Bot ID
   */
  async clearAudio(botId) {
    const session = this.audioSessions.get(botId);
    if (session) {
      try {
        await fs.unlink(session.filepath);
        console.log(`🗑️ Deleted audio file for bot ${botId}`);
      } catch (error) {
        console.error(`Error deleting audio file:`, error);
      }
      this.audioSessions.delete(botId);
    }
  }

  /**
   * Clean up audio files older than 30 minutes
   */
  async cleanupOldFiles() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    console.log('🧹 Cleaning up old audio files...');

    for (const [botId, session] of this.audioSessions.entries()) {
      if (now - session.timestamp > maxAge) {
        await this.clearAudio(botId);
      }
    }
  }

  /**
   * Get all active audio sessions
   *
   * @returns {Array} List of active sessions
   */
  getActiveSessions() {
    return Array.from(this.audioSessions.entries()).map(([botId, session]) => ({
      botId,
      filename: session.audioFile,
      text: session.text,
      timestamp: session.timestamp,
    }));
  }
}

// Export singleton instance
const audioOutputService = new AudioOutputService();
export default audioOutputService;
