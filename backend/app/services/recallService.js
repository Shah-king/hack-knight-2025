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
    this.baseUrl = `https://${this.config.region}.recall.ai/api/v1`;
    this.activeBots = new Map(); // Map of botId -> bot metadata
    this.transcriptConnections = new Map(); // Map of botId -> WebSocket
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
    }
    return isValid;
  }

  /**
   * Get headers for Recall.ai API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    return {
      'Authorization': `Token ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
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

    // Only add webhook config if BACKEND_URL is set and publicly accessible
    // For local development, we'll use WebSocket instead
    const serverUrl = process.env.BACKEND_URL;
    if (serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1')) {
      const webhookUrl = `${serverUrl}/api/webhooks/recall`;
      payload.notification_config = {
        webhook_url: webhookUrl,
        events: ['transcript.segment', 'bot.status_change'],
      };
      console.log('🔗 Webhook configured:', webhookUrl);
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

      // Update local cache
      if (this.activeBots.has(botId)) {
        this.activeBots.get(botId).status = bot.status?.code || bot.status;
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
      console.log(`🔌 Connecting to transcript WebSocket for bot ${botId} (local mode)`);

      const wsUrl = `wss://${this.config.region}.recall.ai/api/v1/bot/${botId}/transcript`;
      const ws = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
        },
      });

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
        console.error(`WebSocket error for bot ${botId}:`, error.message);
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
