import express from 'express';
import aiService from '../services/aiService.js';
import elevenlabsService from '../services/elevenlabsService.js';
import meetingAssistantService from '../services/meetingAssistantService.js';
import audioOutputService from '../services/audioOutputService.js';

const router = express.Router();

// Start AI assistant session for a bot
router.post('/start', async (req, res) => {
  try {
    const { botId, userId, voiceId, autoRespond, responseInterval } = req.body;

    if (!botId || !userId) {
      return res.status(400).json({
        error: 'Bot ID and User ID are required'
      });
    }

    const session = meetingAssistantService.startSession(botId, userId, {
      voiceId,
      autoRespond: autoRespond ?? false,
      responseInterval: responseInterval || 5
    });

    res.json({
      success: true,
      session: {
        botId: session.botId,
        userId: session.userId,
        autoRespond: session.autoRespond,
        responseInterval: session.responseInterval,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error starting assistant session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger AI response
router.post('/respond', async (req, res) => {
  try {
    const { botId, customPrompt } = req.body;

    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }

    const result = await meetingAssistantService.generateAndSpeakResponse(
      botId,
      customPrompt
    );

    res.json({
      success: true,
      response: result.text,
      audioSize: result.audioSize,
      message: 'Response generated and ready for bot to speak'
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get assistant session status
router.get('/session/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const session = meetingAssistantService.getSession(botId);

    if (!session) {
      return res.status(404).json({
        error: 'No active session found for this bot'
      });
    }

    res.json({
      success: true,
      session: {
        botId: session.botId,
        userId: session.userId,
        transcriptCount: session.transcripts.length,
        messageCount: session.messageCount,
        autoRespond: session.autoRespond,
        responseInterval: session.responseInterval,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transcript history
router.get('/transcripts/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const transcripts = meetingAssistantService.getTranscripts(botId);

    res.json({
      success: true,
      transcripts: transcripts.map(t => ({
        speaker: t.speaker,
        text: t.text,
        timestamp: t.timestamp,
        isFinal: t.isFinal
      })),
      count: transcripts.length
    });
  } catch (error) {
    console.error('Error getting transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session configuration
router.patch('/session/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const { autoRespond, responseInterval, voiceId } = req.body;

    const updates = {};
    if (autoRespond !== undefined) updates.autoRespond = autoRespond;
    if (responseInterval !== undefined) updates.responseInterval = responseInterval;
    if (voiceId !== undefined) updates.voiceId = voiceId;

    meetingAssistantService.updateSession(botId, updates);

    res.json({
      success: true,
      message: 'Session configuration updated'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop AI assistant session
router.post('/stop', async (req, res) => {
  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }

    meetingAssistantService.endSession(botId);

    res.json({
      success: true,
      message: 'Assistant session ended'
    });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all active assistant sessions
router.get('/sessions/list', (req, res) => {
  try {
    const sessions = meetingAssistantService.getActiveSessions();

    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI suggested responses based on conversation context
router.post('/suggestions', async (req, res) => {
  try {
    const { transcriptions, count } = req.body;

    if (!transcriptions || transcriptions.length === 0) {
      return res.status(400).json({
        error: 'Transcriptions are required'
      });
    }

    // Generate smart replies using Gemini
    const suggestions = await aiService.generateSmartReplies(
      transcriptions,
      count || 3
    );

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI response based on context
router.post('/generate-response', async (req, res) => {
  try {
    const { transcriptions, prompt } = req.body;

    if (!transcriptions || transcriptions.length === 0) {
      return res.status(400).json({
        error: 'Transcriptions are required'
      });
    }

    // Generate response using Gemini
    const response = await aiService.generateResponse(transcriptions, prompt);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Make bot speak with AI-generated or preset response
router.post('/speak', async (req, res) => {
  try {
    const { botId, text, voiceId, generateResponse, transcriptions } = req.body;

    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }

    let responseText = text;

    // If generateResponse is true, use AI to generate response
    if (generateResponse && transcriptions) {
      responseText = await aiService.generateResponse(transcriptions);
    }

    if (!responseText) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    // Generate audio using ElevenLabs
    const audioBuffer = await elevenlabsService.textToSpeech({
      text: responseText,
      voiceId
    });

    // Note: Audio injection with Recall.ai requires Output Media API
    // This endpoint currently returns the audio for future implementation
    // TODO: Implement Recall.ai Output Media API integration

    res.json({
      success: true,
      text: responseText,
      audio: audioBuffer.toString('base64'),
      audioSize: audioBuffer.length,
      botId,
      message: 'Audio generated. Output Media API integration pending.'
    });
  } catch (error) {
    console.error('Error making bot speak:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze sentiment of conversation
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { transcriptions } = req.body;

    if (!transcriptions || transcriptions.length === 0) {
      return res.status(400).json({
        error: 'Transcriptions are required'
      });
    }

    const analysis = await aiService.analyzeSentiment(transcriptions);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
