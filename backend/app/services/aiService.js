import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AIService - Manages AI/LLM integration using Gemini for summaries and smart replies
 */
class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  /**
   * Validate AI service configuration
   * @returns {boolean} True if config is valid
   */
  validateConfig() {
    return !!this.apiKey;
  }

  /**
   * Generate meeting summary from transcript
   * @param {Array} transcriptions - Array of transcription objects
   * @param {Object} options - Summary options
   * @returns {Promise<Object>} Summary with key points and action items
   */
  async generateSummary(transcriptions, options = {}) {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key not configured');
    }

    if (!transcriptions || transcriptions.length === 0) {
      throw new Error('No transcriptions provided');
    }

    // Convert transcriptions to text
    const transcript = transcriptions
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `You are an AI meeting assistant. Analyze the following meeting transcript and provide:

1. A brief summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Action items with assignees if mentioned (bullet points)
4. Important decisions made (bullet points)

Format your response as JSON with this structure:
{
  "summary": "brief summary here",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": [{"item": "task description", "assignee": "person or null", "dueDate": "date or null"}, ...],
  "decisions": ["decision 1", "decision 2", ...]
}

Transcript:
${transcript}

IMPORTANT: Respond ONLY with valid JSON, no additional text.`;

    try {
      console.log('🤖 Generating AI summary with Gemini...');

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extract JSON from response (in case there's any markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const summary = JSON.parse(jsonMatch[0]);

      console.log('✅ AI summary generated');
      return summary;
    } catch (error) {
      console.error('AI summary error:', error.message);
      throw new Error(`AI summary failed: ${error.message}`);
    }
  }

  /**
   * Generate smart reply suggestions based on recent conversation
   * @param {Array} recentTranscriptions - Recent transcriptions
   * @param {number} count - Number of suggestions to generate
   * @returns {Promise<Array>} Array of suggested replies
   */
  async generateSmartReplies(recentTranscriptions, count = 3) {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key not configured');
    }

    if (!recentTranscriptions || recentTranscriptions.length === 0) {
      throw new Error('No recent transcriptions provided');
    }

    // Get last few messages for context
    const recentContext = recentTranscriptions
      .slice(-5)
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `You are an AI meeting assistant. Based on the recent conversation below, suggest ${count} appropriate short responses (1 sentence each) that the AI could say.

Make them:
- Professional and contextually appropriate
- Brief (under 15 words each)
- Helpful or engaging
- Natural sounding

Format as JSON array of strings:
["response 1", "response 2", "response 3"]

Recent conversation:
${recentContext}

IMPORTANT: Respond ONLY with valid JSON array, no additional text.`;

    try {
      console.log('🤖 Generating smart replies with Gemini...');

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      console.log('✅ Smart replies generated:', suggestions.length);
      return suggestions;
    } catch (error) {
      console.error('Smart reply error:', error.message);
      // Return fallback suggestions
      return [
        "I agree with that approach",
        "Could you elaborate on that?",
        "Let me check on that and get back to you"
      ];
    }
  }

  /**
   * Analyze sentiment of transcriptions
   * @param {Array} transcriptions - Transcriptions to analyze
   * @returns {Promise<Object>} Sentiment analysis
   */
  async analyzeSentiment(transcriptions) {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key not configured');
    }

    const transcript = transcriptions
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `Analyze the sentiment and tone of this meeting transcript. Provide:
1. Overall sentiment (positive, neutral, negative)
2. Overall tone (professional, casual, tense, collaborative, etc.)
3. Key emotional moments if any

Format as JSON:
{
  "sentiment": "positive/neutral/negative",
  "tone": "description",
  "emotionalMoments": ["moment 1", ...]
}

Transcript:
${transcript}

IMPORTANT: Respond ONLY with valid JSON, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      throw new Error('Sentiment analysis failed');
    }
  }

  /**
   * Generate a contextual AI response based on the conversation
   * @param {Array} transcriptions - Conversation history
   * @param {string} userPrompt - Optional custom prompt
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(transcriptions, userPrompt = null) {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key not configured');
    }

    const context = transcriptions
      .slice(-10)
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = userPrompt || `Based on this conversation, generate a helpful, professional response (1-2 sentences):

${context}

Generate a natural, contextually appropriate response.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Response generation error:', error.message);
      throw new Error('Failed to generate response');
    }
  }
}

// Export singleton instance
const aiService = new AIService();

export default aiService;
