import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * RecallDesktopService - Manages Recall.ai SDK Upload integration
 *
 * IMPORTANT: The Desktop SDK is an Electron application (NOT a web library)
 * that records Zoom/Google Meet locally and uploads to Recall.ai.
 *
 * This service handles:
 * - Creating SDK upload tokens for desktop app authentication
 * - Tracking active upload sessions
 * - Processing upload completion webhooks
 *
 * Correct Desktop SDK Flow:
 * 1. Desktop Electron app detects meeting (meeting-detected event)
 * 2. Backend creates SDK Upload via /api/v1/sdk-upload/ and returns upload_token
 * 3. User enters upload_token in Desktop app
 * 4. Desktop app calls startRecording({windowId, uploadToken})
 * 5. After meeting ends, Desktop app calls uploadRecording({windowId})
 * 6. Backend receives sdk_upload.complete webhook with transcripts
 *
 * @see https://docs.recall.ai/docs/sdk-upload
 */
class RecallDesktopService extends EventEmitter {
  constructor() {
    super();

    // Get API key and clean it if it has "Token " prefix
    let apiKey = process.env.RECALL_API_KEY;
    if (apiKey && apiKey.startsWith('Token ')) {
      console.warn('⚠️  Auto-fixing: Removing "Token " prefix from RECALL_API_KEY');
      apiKey = apiKey.substring(6); // Remove "Token " prefix
    }

    this.config = {
      apiKey: apiKey,
      region: process.env.RECALL_REGION || 'us-west-2',
    };
    this.baseUrl = 'https://api.recall.ai/api/v1';
    this.activeUploads = new Map(); // Map of uploadId -> upload metadata
    this.uploadTokens = new Map(); // Map of uploadToken -> uploadId (for webhook lookup)

    console.log('🖥️  RecallDesktopService initialized (SDK Upload mode)');

    // Debug: Log API key status
    if (this.config.apiKey) {
      const maskedKey = this.config.apiKey.substring(0, 8) + '...' + this.config.apiKey.substring(this.config.apiKey.length - 4);
      console.log(`   API Key: ${maskedKey} (length: ${this.config.apiKey.length})`);

      // Check if key already starts with "Token"
      if (this.config.apiKey.startsWith('Token ')) {
        console.warn('   ⚠️  WARNING: API Key starts with "Token " - this will cause double "Token Token" in header!');
        console.warn('   ⚠️  Please remove "Token " from RECALL_API_KEY in .env file');
        console.warn(`   ⚠️  Current: RECALL_API_KEY=${this.config.apiKey.substring(0, 20)}...`);
        console.warn(`   ⚠️  Should be: RECALL_API_KEY=${this.config.apiKey.substring(6, 20)}...`);
      }
    } else {
      console.error('   ❌ API Key: NOT SET (check RECALL_API_KEY in .env)');
    }
    console.log(`   Region: ${this.config.region}`);
    console.log(`   Base URL: ${this.baseUrl}`);
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
   * Create an SDK upload token
   *
   * The Desktop app (Electron) will use this token to authenticate uploads.
   *
   * @param {Object} options - Upload creation options
   * @param {string} options.userId - User ID who is creating the upload
   * @param {string} options.meetingTitle - Optional meeting title
   * @returns {Promise<Object>} Upload token and metadata
   */
  async createUpload({ userId, meetingTitle = 'Desktop Recording' }) {
    console.log(`🖥️  Creating SDK upload for user: ${userId}`);

    if (!this.validateConfig()) {
      throw new Error(
        'Recall.ai not configured. Add RECALL_API_KEY and RECALL_REGION to .env'
      );
    }

    // Check if user already has an active upload
    const existingUpload = this.getUploadByUserId(userId);
    if (existingUpload) {
      throw new Error(
        `User ${userId} already has an active upload (${existingUpload.uploadId}). Complete or cancel the current upload first.`
      );
    }

    const payload = {
      // SDK upload specific configuration
      automatic_leave: {
        noone_joined_timeout: 3600, // Auto-cancel after 1 hour of inactivity
      },
    };

    // Configure transcription provider
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramApiKey) {
      payload.transcription_options = {
        provider: 'deepgram',
      };
      console.log('🎙️ Deepgram transcription enabled for SDK upload');
    } else {
      payload.transcription_options = {
        provider: 'assembly_ai',
      };
      console.log('🎙️ Using default transcription (AssemblyAI) for SDK upload');
    }

    // Configure webhook for upload completion notification
    const serverUrl = process.env.BACKEND_URL;
    if (serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1')) {
      const webhookUrl = `${serverUrl}/api/webhooks/recall-desktop`;
      payload.webhook_url = webhookUrl;
      console.log('🔗 Webhook configured:', webhookUrl);
    } else {
      console.log('⚠️  Webhook disabled (local development)');
      console.log('   Set BACKEND_URL to a public URL for production webhook delivery');
    }

    try {
      // Debug: Log request details
      const headers = this.getHeaders();
      console.log('📡 Making API request to Recall.ai:');
      console.log(`   URL: ${this.baseUrl}/sdk-upload/`);
      console.log(`   Authorization: ${headers.Authorization.substring(0, 14)}...`);

      // Create SDK upload
      const response = await axios.post(`${this.baseUrl}/sdk-upload/`, payload, {
        headers: headers,
      });

      const upload = response.data;
      const uploadId = upload.id;
      const uploadToken = upload.upload_token;

      // Store upload metadata
      this.activeUploads.set(uploadId, {
        uploadId,
        uploadToken,
        userId,
        meetingTitle,
        status: 'created',
        createdAt: new Date(),
      });

      // Store token mapping for webhook lookup
      this.uploadTokens.set(uploadToken, uploadId);

      console.log(`✅ SDK Upload created: ${uploadId}`);
      console.log(`   User: ${userId}`);
      console.log(`   Title: ${meetingTitle}`);
      console.log(`   Upload Token: ${uploadToken.substring(0, 20)}...`);

      // Emit upload-created event
      this.emit('upload-created', { uploadId, userId, uploadToken });

      // Return upload token for Desktop app
      return {
        uploadId,
        uploadToken,
        region: this.config.region,
        webhookUrl: payload.webhook_url,
      };
    } catch (error) {
      console.error('❌ Error creating SDK upload:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.message);

      const errorData = error.response?.data;
      let errorMsg = 'Failed to create SDK upload';

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
   * Get SDK upload status from Recall.ai
   *
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object|null>} Upload status object
   */
  async getUploadStatus(uploadId) {
    try {
      const response = await axios.get(`${this.baseUrl}/sdk-upload/${uploadId}/`, {
        headers: this.getHeaders(),
      });

      const upload = response.data;

      // Update local cache
      if (this.activeUploads.has(uploadId)) {
        const statusCode = upload.status?.code || upload.status || 'unknown';
        this.activeUploads.get(uploadId).status = statusCode;
      }

      return upload;
    } catch (error) {
      console.error(`Error getting upload status for ${uploadId}:`, error.message);
      return null;
    }
  }

  /**
   * Cancel SDK upload
   *
   * @param {string} uploadId - Upload ID
   * @returns {Promise<Object>} Success status
   */
  async cancelUpload(uploadId) {
    console.log(`🖥️  Canceling SDK upload: ${uploadId}`);

    try {
      await axios.delete(`${this.baseUrl}/sdk-upload/${uploadId}/`, {
        headers: this.getHeaders(),
      });

      // Get upload info before deleting
      const uploadInfo = this.activeUploads.get(uploadId);

      // Remove from active uploads
      this.activeUploads.delete(uploadId);
      if (uploadInfo?.uploadToken) {
        this.uploadTokens.delete(uploadInfo.uploadToken);
      }

      // Emit upload-canceled event
      this.emit('upload-canceled', { uploadId, userId: uploadInfo?.userId });

      console.log(`✅ SDK upload ${uploadId} canceled successfully`);
      return { success: true };
    } catch (error) {
      console.error(`Error canceling upload ${uploadId}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle incoming SDK upload completion webhook
   * Emits 'upload-complete' event with transcript data
   *
   * @param {Object} webhookData - Webhook payload from Recall.ai
   */
  handleUploadCompleteWebhook(webhookData) {
    const { id, status, transcripts, metadata } = webhookData;

    if (!id) {
      console.warn('⚠️  Received upload webhook without id');
      return;
    }

    const upload = this.activeUploads.get(id);
    if (!upload) {
      console.warn(`⚠️  Received webhook for unknown upload: ${id}`);
      return;
    }

    // Update upload status
    upload.status = status?.code || status || 'completed';

    console.log(`📝 SDK Upload completed: ${id}`);
    console.log(`   User: ${upload.userId}`);
    console.log(`   Status: ${upload.status}`);
    console.log(`   Transcripts: ${transcripts?.length || 0} segments`);

    // Emit upload-complete event for processing
    this.emit('upload-complete', {
      uploadId: id,
      userId: upload.userId,
      meetingTitle: upload.meetingTitle,
      transcripts,
      metadata,
      status: upload.status,
    });

    // Clean up from active uploads if completed
    if (upload.status === 'completed' || upload.status === 'done') {
      this.activeUploads.delete(id);
      if (upload.uploadToken) {
        this.uploadTokens.delete(upload.uploadToken);
      }
    }
  }

  /**
   * Handle upload failure webhook
   *
   * @param {Object} webhookData - Webhook payload from Recall.ai
   */
  handleUploadFailedWebhook(webhookData) {
    const { id, status, error } = webhookData;

    if (!id) {
      console.warn('⚠️  Received upload failed webhook without id');
      return;
    }

    const upload = this.activeUploads.get(id);
    if (!upload) {
      console.warn(`⚠️  Received failed webhook for unknown upload: ${id}`);
      return;
    }

    console.error(`❌ SDK Upload failed: ${id}`);
    console.error(`   User: ${upload.userId}`);
    console.error(`   Error: ${error || 'Unknown error'}`);

    // Emit upload-failed event
    this.emit('upload-failed', {
      uploadId: id,
      userId: upload.userId,
      error: error || 'Upload failed',
      status: status?.code || status || 'failed',
    });

    // Clean up from active uploads
    this.activeUploads.delete(id);
    if (upload.uploadToken) {
      this.uploadTokens.delete(upload.uploadToken);
    }
  }

  /**
   * Get upload by user ID
   *
   * @param {string} userId - User ID
   * @returns {Object|null} Upload instance
   */
  getUploadByUserId(userId) {
    for (const upload of this.activeUploads.values()) {
      if (upload.userId === userId) {
        return upload;
      }
    }
    return null;
  }

  /**
   * Get all active uploads
   *
   * @returns {Array} List of active upload metadata
   */
  getAllUploads() {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Clean up all uploads (for shutdown)
   */
  async cleanup() {
    console.log(`🧹 Cleaning up ${this.activeUploads.size} active SDK uploads`);

    const promises = Array.from(this.activeUploads.keys()).map((uploadId) =>
      this.cancelUpload(uploadId).catch((err) =>
        console.error(`Error canceling upload ${uploadId}:`, err)
      )
    );

    await Promise.all(promises);
    console.log('✅ All SDK uploads cleaned up');
  }
}

// Export singleton instance
const recallDesktopService = new RecallDesktopService();
export default recallDesktopService;
