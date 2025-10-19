import express from 'express';
import elevenlabsService from '../services/elevenlabsService.js';
import recallService from '../services/recallService.js';
import audioOutputService from '../services/audioOutputService.js';

const router = express.Router();

// Clone voice from audio samples
router.post('/clone', async (req, res) => {
  try {
    const { name, description, audioSamples, userId } = req.body;

    if (!name || !audioSamples || audioSamples.length === 0) {
      return res.status(400).json({
        error: 'Name and audio samples are required'
      });
    }

    // Convert base64 audio samples to buffers
    const buffers = audioSamples.map(sample =>
      Buffer.from(sample, 'base64')
    );

    const result = await elevenlabsService.cloneVoice({
      name,
      description,
      audioSamples: buffers,
      labels: ['custom', userId]
    });

    res.json({
      success: true,
      voiceId: result.voice_id,
      message: 'Voice cloned successfully'
    });
  } catch (error) {
    console.error('Voice cloning error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate speech from text (TTS)
router.post('/speak', async (req, res) => {
  try {
    const { text, voiceId, botId, stability, similarityBoost } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate audio
    const audioBuffer = await elevenlabsService.textToSpeech({
      text,
      voiceId,
      stability,
      similarityBoost
    });

    // If botId is provided, save audio for Output Media API
    if (botId) {
      try {
        await audioOutputService.saveAudio(botId, audioBuffer, text);
        console.log(`✅ Audio saved for bot ${botId} - ready for Output Media API`);
      } catch (error) {
        console.error('Error saving audio:', error);
      }
    }

    // Return audio as base64
    res.json({
      success: true,
      audio: audioBuffer.toString('base64'),
      text,
      size: audioBuffer.length,
      botId: botId || null,
      message: botId ? 'Audio saved and ready for bot to speak' : 'Audio generated'
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available voices
router.get('/list', async (req, res) => {
  try {
    const voices = await elevenlabsService.getVoices();

    res.json({
      success: true,
      voices: voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description,
        labels: v.labels
      }))
    });
  } catch (error) {
    console.error('Error listing voices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get voice details
router.get('/:voiceId', async (req, res) => {
  try {
    const { voiceId } = req.params;
    const voice = await elevenlabsService.getVoice(voiceId);

    res.json({
      success: true,
      voice
    });
  } catch (error) {
    console.error('Error getting voice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete voice
router.delete('/:voiceId', async (req, res) => {
  try {
    const { voiceId } = req.params;
    await elevenlabsService.deleteVoice(voiceId);

    res.json({
      success: true,
      message: 'Voice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voice:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
