import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * ElevenLabsService - Manages voice cloning and text-to-speech
 *
 * This service handles:
 * - Text-to-speech conversion
 * - Voice cloning from audio samples
 * - Audio generation for bot responses
 */
class ElevenLabsService extends EventEmitter {
  constructor() {
    super();
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.defaultVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default voice (Rachel)
  }

  /**
   * Validate ElevenLabs configuration
   * @returns {boolean} True if config is valid
   */
  validateConfig() {
    return !!this.apiKey;
  }

  /**
   * Convert text to speech
   * @param {Object} options - TTS options
   * @param {string} options.text - Text to convert
   * @param {string} options.voiceId - Voice ID to use (optional)
   * @param {number} options.stability - Voice stability 0-1 (optional)
   * @param {number} options.similarityBoost - Similarity boost 0-1 (optional)
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech({
    text,
    voiceId = this.defaultVoiceId,
    stability = 0.5,
    similarityBoost = 0.75
  }) {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    console.log(`🔊 Generating speech for: "${text.substring(0, 50)}..."`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBuffer = Buffer.from(response.data);
      console.log(`✅ Generated ${audioBuffer.length} bytes of audio`);

      this.emit('tts-generated', {
        text,
        voiceId,
        size: audioBuffer.length
      });

      return audioBuffer;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error.response?.data || error.message);
      throw new Error(`TTS failed: ${error.response?.data?.detail?.message || error.message}`);
    }
  }

  /**
   * Get list of available voices
   * @returns {Promise<Array>} List of voices
   */
  async getVoices() {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error.response?.data || error.message);
      throw new Error('Failed to fetch voices');
    }
  }

  /**
   * Get voice details
   * @param {string} voiceId - Voice ID
   * @returns {Promise<Object>} Voice details
   */
  async getVoice(voiceId) {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching voice:', error.response?.data || error.message);
      throw new Error('Failed to fetch voice details');
    }
  }

  /**
   * Clone a voice from audio samples
   * @param {Object} options - Clone options
   * @param {string} options.name - Voice name
   * @param {string} options.description - Voice description
   * @param {Array<Buffer>} options.audioSamples - Audio samples (buffers)
   * @param {Array<string>} options.labels - Voice labels (optional)
   * @returns {Promise<Object>} Cloned voice data
   */
  async cloneVoice({ name, description, audioSamples, labels = [] }) {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!name || !audioSamples || audioSamples.length === 0) {
      throw new Error('Name and audio samples are required for voice cloning');
    }

    console.log(`🎤 Cloning voice: ${name} with ${audioSamples.length} samples`);

    try {
      // Create FormData for multipart/form-data request
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      formData.append('name', name);
      if (description) {
        formData.append('description', description);
      }

      // Add audio samples
      audioSamples.forEach((buffer, index) => {
        formData.append('files', buffer, {
          filename: `sample_${index + 1}.mp3`,
          contentType: 'audio/mpeg'
        });
      });

      // Add labels
      if (labels.length > 0) {
        formData.append('labels', JSON.stringify(labels));
      }

      const response = await axios.post(
        `${this.baseUrl}/voices/add`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'xi-api-key': this.apiKey
          }
        }
      );

      console.log(`✅ Voice cloned successfully: ${response.data.voice_id}`);

      this.emit('voice-cloned', {
        voiceId: response.data.voice_id,
        name
      });

      return response.data;
    } catch (error) {
      console.error('Voice cloning error:', error.response?.data || error.message);
      throw new Error(`Voice cloning failed: ${error.response?.data?.detail?.message || error.message}`);
    }
  }

  /**
   * Delete a voice
   * @param {string} voiceId - Voice ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteVoice(voiceId) {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      await axios.delete(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      console.log(`🗑️  Voice ${voiceId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting voice:', error.response?.data || error.message);
      throw new Error('Failed to delete voice');
    }
  }

  /**
   * Get user subscription info
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscriptionInfo() {
    if (!this.validateConfig()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user/subscription`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error.response?.data || error.message);
      throw new Error('Failed to fetch subscription info');
    }
  }
}

// Export singleton instance
const elevenlabsService = new ElevenLabsService();

// Validate config on startup
if (elevenlabsService.validateConfig()) {
  console.log('✅ ElevenLabs TTS configured and ready');
} else {
  console.log('⚠️  ElevenLabs not configured - voice synthesis disabled');
  console.log('   Add ELEVENLABS_API_KEY to .env to enable voice features');
}

export default elevenlabsService;
