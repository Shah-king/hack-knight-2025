import express from 'express';
import aiService from '../services/aiService.js';
import elevenlabsService from '../services/elevenlabsService.js';

const router = express.Router();

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
