import axios from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * RecallService - Manages Recall.ai Meeting Bot API integration
 *
 * This service handles:
 * - Creating bots that join meetings on any platform (Zoom, Meet, Teams, etc.)
 * - Managing bot lifecycle (create, status, leave)
 * - Real-time transcript streaming via WebSocket
 * - Bot event broadcasting
 *
 * @see https://docs.recall.ai/
 */
class RecallService extends EventEmitter {
  constructor() {
    super();
    this.config = {
      apiKey: process.env.RECALL_API_KEY,
      region: process.env.RECALL_REGION || 'us-west-2',
    };
    // Recall.ai uses a single global API endpoint, not region-specific
    this.baseUrl = 'https://api.recall.ai/api/v1';
    this.activeBots = new Map(); // Map of botId -> bot metadata
    this.transcriptConnections = new Map(); // Map of botId -> WebSocket

    console.log('🔧 RecallService initialized with base URL:', this.baseUrl);
  }

  /**
   * Validate Recall.ai configuration
   * @returns {boolean} True if config is valid
   */
  validateConfig() {
    const isValid = !!(this.config.apiKey && this.config.region);
    if (!isValid) {
      console.warn(
        '⚠️  Recall.ai credentials missing. Required: RECALL_API_KEY and RECALL_REGION'
      );
      console.warn('   Current config:', {
        apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : 'NOT SET',
        region: this.config.region,
      });
    }
    return isValid;
  }

  /**
   * Get headers for Recall.ai API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    // Recall.ai expects: Authorization: Token YOUR_API_KEY
    const headers = {
      'Authorization': `${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Debug: Log sanitized headers (first 20 chars of token only)
    console.log('🔑 Request headers:', {
      'Authorization': this.config.apiKey
        ? `${this.config.apiKey.substring(0, 20)}...`
        : 'MISSING',
      'Content-Type': 'application/json',
    });

    return headers;
  }

  /**
   * Create a bot and join a meeting
   *
   * @param {Object} options - Bot creation options
   * @param {string} options.meetingUrl - Meeting URL (Zoom, Meet, Teams, etc.)
   * @param {string} options.botName - Display name for the bot (default: "AI Assistant")
   * @param {string} options.userId - User ID who launched the bot
   * @param {boolean} options.enableAudioOutput - Enable audio output via Output Media API
   * @returns {Promise<Object>} Bot instance from Recall.ai
   */
  async createBot({ meetingUrl, botName = 'AI Assistant', userId, enableAudioOutput = false }) {
    console.log(`🤖 Creating Recall.ai bot for meeting: ${meetingUrl}`);

    if (!this.validateConfig()) {
      throw new Error(
        'Recall.ai not configured. Add RECALL_API_KEY and RECALL_REGION to .env'
      );
    }

    // Check if user already has an active bot
    const existingBot = this.getBotByUserId(userId);
    if (existingBot) {
      throw new Error(
        `User ${userId} already has an active bot (${existingBot.botId}). Leave the current meeting first.`
      );
    }

    const payload = {
      meeting_url: meetingUrl,
      bot_name: botName,
      chat: {
        on_bot_join: {
          send_to: 'everyone',
          message: `👋 ${botName} has joined to assist you`,
        },
      },
      automatic_leave: {
        waiting_room_timeout: 600, // Leave after 10 min in waiting room
        noone_joined_timeout: 1200, // Leave after 20 min if no one joins
      },
    };

    // Configure transcription provider
    // Use Deepgram if API key is available, otherwise use Recall.ai's built-in provider
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramApiKey) {
      // Use Deepgram for enhanced transcription quality
      payload.transcription_options = {
        provider: 'deepgram',
      };
      console.log('🎙️ Deepgram transcription enabled');
    } else {
      // Fallback to Recall.ai's built-in streaming transcription
      payload.transcription_options = {
        provider: 'assembly_ai',  // Recall.ai's default provider
      };
      console.log('🎙️ Using Recall.ai default transcription (AssemblyAI)');
      console.log('   💡 Set DEEPGRAM_API_KEY for enhanced transcription');
    }

    // Configure webhook for real-time transcript delivery
    // Transcripts will be delivered via webhook (production) or WebSocket (local dev)
    const serverUrl = process.env.BACKEND_URL;
    if (serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1')) {
      const webhookUrl = `${serverUrl}/api/webhooks/recall`;
      payload.webhook_url = webhookUrl;
      console.log('🔗 Webhook configured:', webhookUrl);
      console.log('   Events: bot.status_change, transcript.segment');
    } else {
      console.log('ℹ️  Webhook disabled (local development) - will use WebSocket fallback');
    }

    // Add Output Media API configuration if audio output is enabled
    if (enableAudioOutput && serverUrl) {
      payload.output_media = {
        camera: null,
        microphone: {
          kind: 'webpage',
          config: {
            url: `${serverUrl}/api/audio/output-media`,
          },
        },
      };
      console.log(`🔊 Output Media API enabled`);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/bot`, payload, {
        headers: this.getHeaders(),
      });

      const bot = response.data;

      // Extract status safely (Recall.ai response format may vary)
      const statusCode = bot.status?.code || bot.status || 'created';

      // Store bot metadata
      this.activeBots.set(bot.id, {
        botId: bot.id,
        meetingUrl,
        botName,
        userId,
        status: statusCode,
        createdAt: new Date(),
      });

      console.log(`✅ Bot created successfully: ${bot.id}`);
      console.log(`   Status: ${statusCode}`);
      console.log(`   Meeting URL: ${meetingUrl}`);

      // Emit bot-created event
      this.emit('bot-created', { botId: bot.id, userId, status: statusCode });

      // Set up transcript stream (webhook or WebSocket)
      this.connectTranscriptStream(bot.id, userId);

      return bot;
    } catch (error) {
      console.error('❌ Error creating bot:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.message);

      // Extract user-friendly error message
      const errorData = error.response?.data;
      let errorMsg = 'Failed to create bot';

      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        }
      }

      throw new Error(errorMsg);
    }
  }

  /**
   * Get bot status from Recall.ai
   *
   * @param {string} botId - Bot ID
   * @returns {Promise<Object|null>} Bot status object
   */
  async getBotStatus(botId) {
    try {
      const response = await axios.get(`${this.baseUrl}/bot/${botId}`, {
        headers: this.getHeaders(),
      });

      const bot = response.data;

      // Update local cache - handle both status formats
      if (this.activeBots.has(botId)) {
        const statusCode = bot.status?.code || bot.status || 'unknown';
        this.activeBots.get(botId).status = statusCode;
      }

      return bot;
    } catch (error) {
      console.error(`Error getting bot status for ${botId}:`, error.message);
      return null;
    }
  }

  /**
   * Leave meeting and delete bot
   *
   * @param {string} botId - Bot ID
   * @returns {Promise<Object>} Success status
   */
  async leaveBot(botId) {
    console.log(`🤖 Bot ${botId} leaving meeting`);

    try {
      await axios.delete(`${this.baseUrl}/bot/${botId}`, {
        headers: this.getHeaders(),
      });

      // Close transcript connection if exists
      if (this.transcriptConnections.has(botId)) {
        const connection = this.transcriptConnections.get(botId);

        // Close WebSocket if it's a WebSocket connection
        if (connection.type === 'websocket' && connection.ws) {
          connection.ws.close();
        }

        this.transcriptConnections.delete(botId);
      }

      // Get bot info before deleting
      const botInfo = this.activeBots.get(botId);

      // Remove from active bots
      this.activeBots.delete(botId);

      // Emit bot-left event
      this.emit('bot-left', { botId, userId: botInfo?.userId });

      console.log(`✅ Bot ${botId} left successfully`);
      return { success: true };
    } catch (error) {
      console.error(`Error leaving bot ${botId}:`, error.message);
      throw error;
    }
  }

  /**
   * Set up transcript stream (webhook or WebSocket fallback)
   * - Production: Uses webhooks (push-based, most efficient)
   * - Local dev: Uses WebSocket (works without public URL)
   *
   * @param {string} botId - Bot ID
   * @param {string} userId - User ID who owns the bot
   */
  connectTranscriptStream(botId, userId) {
    const serverUrl = process.env.BACKEND_URL;
    const useWebhook = serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1');

    if (useWebhook) {
      // Webhook mode (production)
      console.log(`🔌 Webhook-based transcript stream configured for bot ${botId}`);
      console.log(`   Transcript segments will be delivered to /api/webhooks/recall`);

      this.transcriptConnections.set(botId, {
        type: 'webhook',
        userId,
        connectedAt: new Date(),
      });

      console.log(`✅ Transcript webhook ready for bot ${botId}`);
    } else {
      // WebSocket fallback (local development)
      // NOTE: The WebSocket endpoint may not be available for all Recall.ai accounts
      // If you get 404 errors, you need to set BACKEND_URL to use webhooks instead
      console.log(`🔌 Attempting to connect to transcript WebSocket for bot ${botId} (local mode)`);
      console.log(`   ⚠️  If this fails with 404, set BACKEND_URL to use webhooks`);

      const wsUrl = `wss://${this.config.region}.recall.ai/api/v2/bot/${botId}/transcript?authorization=Token ${this.config.apiKey}`;
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log(`✅ Transcript WebSocket connected for bot ${botId}`);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'transcript') {
            const transcript = message.data;

            // Extract text from words array
            const text = transcript.words?.map(w => w.text).join(' ') || '';

            // Emit transcript event (same format as webhook)
            this.emit('transcript', {
              botId,
              userId,
              speaker: transcript.speaker || 'Unknown',
              text: text,
              isFinal: transcript.is_final !== false,
              timestamp: new Date(),
              confidence: 1.0,
            });
          }
        } catch (error) {
          console.error('Error parsing transcript:', error);
        }
      });

      ws.on('error', (error) => {
        console.warn(`⚠️  WebSocket error for bot ${botId}: ${error.message}`);
        console.warn(`   The transcript WebSocket endpoint may not be available.`);
        console.warn(`   Set BACKEND_URL to a public URL to use webhooks instead.`);

        // Don't try to reconnect - just mark as failed
        this.transcriptConnections.set(botId, {
          type: 'websocket-failed',
          userId,
          error: error.message,
          connectedAt: new Date(),
        });
      });

      ws.on('close', () => {
        console.log(`🔌 Transcript WebSocket closed for bot ${botId}`);
        this.transcriptConnections.delete(botId);
      });

      this.transcriptConnections.set(botId, {
        type: 'websocket',
        userId,
        ws: ws,
        connectedAt: new Date(),
      });
    }
  }

  /**
   * Get bot instance by user ID
   *
   * @param {string} userId - User ID
   * @returns {Object|null} Bot instance
   */
  getBotByUserId(userId) {
    for (const bot of this.activeBots.values()) {
      if (bot.userId === userId) {
        return bot;
      }
    }
    return null;
  }

  /**
   * Get all active bots
   *
   * @returns {Array} List of active bot metadata
   */
  getAllBots() {
    return Array.from(this.activeBots.values());
  }

  /**
   * Clean up all bots (for shutdown)
   */
  async cleanup() {
    console.log(`🧹 Cleaning up ${this.activeBots.size} active bots`);

    const promises = Array.from(this.activeBots.keys()).map((botId) =>
      this.leaveBot(botId).catch((err) =>
        console.error(`Error leaving bot ${botId}:`, err)
      )
    );

    await Promise.all(promises);
    console.log('✅ All bots cleaned up');
  }
}

// Export singleton instance
const recallService = new RecallService();
export default recallService;
