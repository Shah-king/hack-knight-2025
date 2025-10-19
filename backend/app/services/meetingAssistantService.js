import { EventEmitter } from 'events';
import aiService from './aiService.js';
import elevenlabsService from './elevenlabsService.js';
import audioOutputService from './audioOutputService.js';

/**
 * MeetingAssistantService - AI assistant that listens to meetings and responds
 *
 * This service:
 * - Collects real-time transcripts
 * - Analyzes conversation context
 * - Generates intelligent responses
 * - Converts responses to speech
 * - Triggers bot to speak in meeting
 */
class MeetingAssistantService extends EventEmitter {
  constructor() {
    super();
    this.meetingSessions = new Map(); // botId -> session data
    this.config = {
      maxTranscriptHistory: 50, // Keep last 50 transcript entries
      responseThreshold: 5, // Respond after every 5 user messages
      autoRespond: false, // Manual response by default
    };
  }

  /**
   * Start monitoring a meeting
   *
   * @param {string} botId - Bot ID
   * @param {string} userId - User ID who owns the bot
   * @param {Object} options - Configuration options
   */
  startSession(botId, userId, options = {}) {
    const session = {
      botId,
      userId,
      transcripts: [],
      messageCount: 0,
      lastResponseTime: Date.now(),
      voiceId: options.voiceId || null,
      autoRespond: options.autoRespond ?? this.config.autoRespond,
      responseInterval: options.responseInterval || this.config.responseThreshold,
      createdAt: Date.now(),
    };

    this.meetingSessions.set(botId, session);
    console.log(`🎙️ Meeting assistant started for bot ${botId}`);
    console.log(`   Auto-respond: ${session.autoRespond}`);

    return session;
  }

  /**
   * Add transcript to session
   *
   * @param {string} botId - Bot ID
   * @param {Object} transcript - Transcript data
   */
  addTranscript(botId, transcript) {
    const session = this.meetingSessions.get(botId);
    if (!session) {
      console.warn(`No session found for bot ${botId}`);
      return;
    }

    // Add transcript to history
    session.transcripts.push({
      speaker: transcript.speaker,
      text: transcript.text,
      timestamp: transcript.timestamp || new Date(),
      isFinal: transcript.isFinal,
    });

    // Keep only last N transcripts
    if (session.transcripts.length > this.config.maxTranscriptHistory) {
      session.transcripts = session.transcripts.slice(-this.config.maxTranscriptHistory);
    }

    // Count messages (only final transcripts)
    if (transcript.isFinal) {
      session.messageCount++;

      console.log(`📝 Transcript added (${session.messageCount} total)`);
      console.log(`   Speaker: ${transcript.speaker}`);
      console.log(`   Text: ${transcript.text}`);

      // Auto-respond if enabled and threshold reached
      if (session.autoRespond && session.messageCount >= session.responseInterval) {
        this.generateAndSpeakResponse(botId);
        session.messageCount = 0; // Reset counter
      }
    }

    this.emit('transcript-added', { botId, transcript });
  }

  /**
   * Generate AI response based on transcript history
   *
   * @param {string} botId - Bot ID
   * @param {string} customPrompt - Optional custom prompt
   * @returns {Promise<string>} Generated response text
   */
  async generateResponse(botId, customPrompt = null) {
    const session = this.meetingSessions.get(botId);
    if (!session) {
      throw new Error(`No session found for bot ${botId}`);
    }

    // Get final transcripts only
    const finalTranscripts = session.transcripts
      .filter(t => t.isFinal)
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    if (!finalTranscripts) {
      throw new Error('No transcripts available yet');
    }

    console.log(`🤖 Generating AI response for bot ${botId}...`);
    console.log(`   Transcript history: ${session.transcripts.filter(t => t.isFinal).length} messages`);

    // Generate response using Gemini
    const prompt = customPrompt || `You are an AI meeting assistant. Based on the following conversation, provide a helpful, concise response or summary.

Conversation:
${finalTranscripts}

Provide a brief, natural response (1-2 sentences):`;

    const response = await aiService.generateResponse([{ text: finalTranscripts }], prompt);

    console.log(`✅ AI Response generated: "${response}"`);

    this.emit('response-generated', { botId, response });

    return response;
  }

  /**
   * Generate response and convert to speech
   *
   * @param {string} botId - Bot ID
   * @param {string} customPrompt - Optional custom prompt
   * @returns {Promise<Object>} Response data with audio
   */
  async generateAndSpeakResponse(botId, customPrompt = null) {
    const session = this.meetingSessions.get(botId);
    if (!session) {
      throw new Error(`No session found for bot ${botId}`);
    }

    try {
      // Generate AI response
      const responseText = await this.generateResponse(botId, customPrompt);

      // Convert to speech
      console.log(`🔊 Converting response to speech...`);
      const audioBuffer = await elevenlabsService.textToSpeech({
        text: responseText,
        voiceId: session.voiceId,
      });

      // Save audio for Output Media API
      await audioOutputService.saveAudio(botId, audioBuffer, responseText);

      console.log(`✅ Response ready for bot to speak!`);
      console.log(`   Text: "${responseText}"`);
      console.log(`   Audio size: ${audioBuffer.length} bytes`);

      this.emit('response-ready', {
        botId,
        text: responseText,
        audioSize: audioBuffer.length
      });

      return {
        text: responseText,
        audioSize: audioBuffer.length,
        success: true,
      };
    } catch (error) {
      console.error(`Error generating response for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Get session data
   *
   * @param {string} botId - Bot ID
   * @returns {Object|null} Session data
   */
  getSession(botId) {
    return this.meetingSessions.get(botId) || null;
  }

  /**
   * Get transcript history
   *
   * @param {string} botId - Bot ID
   * @returns {Array} Transcript history
   */
  getTranscripts(botId) {
    const session = this.meetingSessions.get(botId);
    return session ? session.transcripts : [];
  }

  /**
   * Update session configuration
   *
   * @param {string} botId - Bot ID
   * @param {Object} config - Configuration updates
   */
  updateSession(botId, config) {
    const session = this.meetingSessions.get(botId);
    if (session) {
      Object.assign(session, config);
      console.log(`⚙️ Session updated for bot ${botId}`);
    }
  }

  /**
   * End session and cleanup
   *
   * @param {string} botId - Bot ID
   */
  endSession(botId) {
    const session = this.meetingSessions.get(botId);
    if (session) {
      console.log(`🛑 Ending meeting assistant session for bot ${botId}`);
      console.log(`   Total transcripts: ${session.transcripts.length}`);
      console.log(`   Session duration: ${Math.round((Date.now() - session.createdAt) / 1000)}s`);

      this.meetingSessions.delete(botId);
      this.emit('session-ended', { botId });
    }
  }

  /**
   * Get all active sessions
   *
   * @returns {Array} List of active sessions
   */
  getActiveSessions() {
    return Array.from(this.meetingSessions.entries()).map(([botId, session]) => ({
      botId,
      userId: session.userId,
      transcriptCount: session.transcripts.length,
      messageCount: session.messageCount,
      autoRespond: session.autoRespond,
      createdAt: session.createdAt,
    }));
  }
}

// Export singleton instance
const meetingAssistantService = new MeetingAssistantService();
export default meetingAssistantService;
