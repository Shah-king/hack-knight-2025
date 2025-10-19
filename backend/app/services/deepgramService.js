import { createClient } from '@deepgram/sdk';

class DeepgramService {
  constructor() {
    this.deepgram = null;
    this.activeConnections = new Map(); // Store active Deepgram connections
  }

  /**
   * Validate Deepgram configuration
   * @returns {boolean} True if config is valid
   */
  validateConfig() {
    const isValid = !!process.env.DEEPGRAM_API_KEY;
    if (!isValid) {
      console.warn('⚠️  Deepgram API key missing. Required: DEEPGRAM_API_KEY');
    }
    return isValid;
  }

  /**
   * Lazy-load Deepgram client
   * @returns {DeepgramClient}
   */
  getClient() {
    if (!this.deepgram) {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPGRAM_API_KEY not found in environment variables');
      }
      this.deepgram = createClient(apiKey);
      console.log('✅ Deepgram client initialized');
    }
    return this.deepgram;
  }

  /**
   * Create a new live transcription connection for a meeting
   * @param {string} meetingId - Unique meeting identifier
   * @param {function} onTranscript - Callback for transcription results
   * @param {function} onError - Callback for errors
   * @returns {object} Deepgram connection object
   */
  async createLiveTranscription(meetingId, onTranscript, onError) {
    try {
      // Get or create Deepgram client
      const deepgram = this.getClient();

      // Create Deepgram live transcription connection
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        interim_results: true, // Get interim results for real-time display
        endpointing: 300, // Wait 300ms of silence before finalizing
        utterance_end_ms: 1000
      });

      // Handle transcription results
      connection.on('Results', (data) => {
        const transcript = data.channel?.alternatives?.[0];

        if (transcript && transcript.transcript.trim() !== '') {
          const result = {
            text: transcript.transcript,
            isFinal: data.is_final,
            confidence: transcript.confidence,
            timestamp: new Date()
          };

          onTranscript(result);
        }
      });

      // Handle errors
      connection.on('error', (error) => {
        console.error(`Deepgram error for meeting ${meetingId}:`, error);
        onError(error);
      });

      // Handle connection close
      connection.on('close', () => {
        console.log(`Deepgram connection closed for meeting ${meetingId}`);
        this.activeConnections.delete(meetingId);
      });

      // Wait for connection to open
      await new Promise((resolve, reject) => {
        connection.on('open', () => {
          console.log(`✅ Deepgram connection opened for meeting ${meetingId}`);
          resolve();
        });
        connection.on('error', reject);
      });

      // Store the connection
      this.activeConnections.set(meetingId, connection);

      return connection;
    } catch (error) {
      console.error('Failed to create Deepgram connection:', error);
      throw error;
    }
  }

  /**
   * Send audio data to active transcription
   * @param {string} meetingId - Meeting identifier
   * @param {Buffer} audioData - Audio data chunk
   */
  sendAudio(meetingId, audioData) {
    const connection = this.activeConnections.get(meetingId);

    if (!connection) {
      throw new Error(`No active Deepgram connection for meeting ${meetingId}`);
    }

    try {
      connection.send(audioData);
    } catch (error) {
      console.error(`Failed to send audio for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Close transcription for a meeting
   * @param {string} meetingId - Meeting identifier
   */
  closeTranscription(meetingId) {
    const connection = this.activeConnections.get(meetingId);

    if (connection) {
      try {
        connection.finish();
        this.activeConnections.delete(meetingId);
        console.log(`Closed Deepgram connection for meeting ${meetingId}`);
      } catch (error) {
        console.error(`Error closing Deepgram connection for meeting ${meetingId}:`, error);
      }
    }
  }

  /**
   * Check if a meeting has an active connection
   * @param {string} meetingId - Meeting identifier
   * @returns {boolean}
   */
  hasActiveConnection(meetingId) {
    return this.activeConnections.has(meetingId);
  }

  /**
   * Get number of active connections
   * @returns {number}
   */
  getActiveConnectionCount() {
    return this.activeConnections.size;
  }
}

// Export singleton instance
const deepgramService = new DeepgramService();
export default deepgramService;
