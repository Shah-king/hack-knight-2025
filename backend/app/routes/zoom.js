import express from 'express';
import zoomService from '../services/zoomService.js';

const router = express.Router();

/**
 * Launch bot to join a Zoom meeting
 * POST /api/zoom/launch
 */
router.post('/launch', async (req, res) => {
  try {
    const { meetingId, botName, userId, password } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        error: 'Meeting ID or URL is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    // Check if user already has an active bot
    const existingBot = zoomService.getBotByUserId(userId);
    if (existingBot) {
      return res.status(409).json({
        error: 'You already have an active bot in a meeting',
        bot: {
          botId: existingBot.botId,
          meetingNumber: existingBot.meetingNumber,
          status: existingBot.status
        }
      });
    }

    // Join the meeting
    const bot = await zoomService.joinMeeting({
      meetingId,
      botName: botName || 'EchoTwin AI',
      userId,
      password
    });

    res.json({
      success: true,
      message: 'Bot is joining the meeting',
      bot: {
        botId: bot.botId,
        meetingNumber: bot.meetingNumber,
        botName: bot.botName,
        status: bot.status,
        joinedAt: bot.joinedAt
      }
    });
  } catch (error) {
    console.error('Error launching bot:', error);
    res.status(500).json({
      error: error.message || 'Failed to launch bot'
    });
  }
});

/**
 * Get bot status
 * GET /api/zoom/status/:botId
 */
router.get('/status/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const status = zoomService.getBotStatus(botId);

    if (!status) {
      return res.status(404).json({
        error: 'Bot not found'
      });
    }

    res.json({
      success: true,
      bot: status
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get bot status'
    });
  }
});

/**
 * Leave meeting and disconnect bot
 * POST /api/zoom/leave
 */
router.post('/leave', async (req, res) => {
  try {
    const { botId, userId } = req.body;

    if (!botId && !userId) {
      return res.status(400).json({
        error: 'Bot ID or User ID is required'
      });
    }

    // Find bot by botId or userId
    let targetBotId = botId;
    if (!targetBotId && userId) {
      const bot = zoomService.getBotByUserId(userId);
      if (bot) {
        targetBotId = bot.botId;
      }
    }

    if (!targetBotId) {
      return res.status(404).json({
        error: 'Bot not found'
      });
    }

    const result = await zoomService.leaveMeeting(targetBotId);

    res.json({
      success: true,
      message: 'Bot has left the meeting',
      result
    });
  } catch (error) {
    console.error('Error leaving meeting:', error);
    res.status(500).json({
      error: error.message || 'Failed to leave meeting'
    });
  }
});

/**
 * Mute bot in meeting
 * POST /api/zoom/mute
 */
router.post('/mute', async (req, res) => {
  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({
        error: 'Bot ID is required'
      });
    }

    const result = await zoomService.mute(botId);

    res.json({
      success: true,
      message: 'Bot muted',
      result
    });
  } catch (error) {
    console.error('Error muting bot:', error);
    res.status(500).json({
      error: error.message || 'Failed to mute bot'
    });
  }
});

/**
 * Unmute bot in meeting
 * POST /api/zoom/unmute
 */
router.post('/unmute', async (req, res) => {
  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({
        error: 'Bot ID is required'
      });
    }

    const result = await zoomService.unmute(botId);

    res.json({
      success: true,
      message: 'Bot unmuted',
      result
    });
  } catch (error) {
    console.error('Error unmuting bot:', error);
    res.status(500).json({
      error: error.message || 'Failed to unmute bot'
    });
  }
});

/**
 * Get all active bots (admin endpoint)
 * GET /api/zoom/bots
 */
router.get('/bots', (req, res) => {
  try {
    const bots = zoomService.getAllBots();

    res.json({
      success: true,
      count: bots.length,
      bots
    });
  } catch (error) {
    console.error('Error getting bots:', error);
    res.status(500).json({
      error: error.message || 'Failed to get bots'
    });
  }
});

/**
 * Get user's active bot
 * GET /api/zoom/my-bot/:userId
 */
router.get('/my-bot/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const bot = zoomService.getBotByUserId(userId);

    if (!bot) {
      return res.status(404).json({
        error: 'No active bot found for this user'
      });
    }

    res.json({
      success: true,
      bot: {
        botId: bot.botId,
        meetingNumber: bot.meetingNumber,
        botName: bot.botName,
        status: bot.status,
        isMuted: bot.isMuted,
        joinedAt: bot.joinedAt
      }
    });
  } catch (error) {
    console.error('Error getting user bot:', error);
    res.status(500).json({
      error: error.message || 'Failed to get bot'
    });
  }
});

/**
 * Inject audio into meeting (for AI Twin to speak)
 * POST /api/zoom/speak
 */
router.post('/speak', async (req, res) => {
  try {
    const { botId, audioData } = req.body;

    if (!botId) {
      return res.status(400).json({
        error: 'Bot ID is required'
      });
    }

    if (!audioData) {
      return res.status(400).json({
        error: 'Audio data is required'
      });
    }

    // Convert base64 audio to buffer if needed
    const audioBuffer = Buffer.isBuffer(audioData)
      ? audioData
      : Buffer.from(audioData, 'base64');

    const success = await zoomService.injectAudio(botId, audioBuffer);

    res.json({
      success,
      message: 'Audio injected into meeting',
      size: audioBuffer.length
    });
  } catch (error) {
    console.error('Error injecting audio:', error);
    res.status(500).json({
      error: error.message || 'Failed to inject audio'
    });
  }
});

export default router;
