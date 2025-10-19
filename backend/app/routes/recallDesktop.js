import express from 'express';
import recallDesktopService from '../services/recallDesktopService.js';
import Meeting from '../models/Meeting.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Create an SDK upload token for Desktop app
 * POST /api/recall-desktop/create-upload
 *
 * The Desktop SDK (Electron app) uses this token to authenticate recordings.
 *
 * Body:
 *   - userId: User ID who is creating the upload
 *   - meetingTitle: Optional meeting title
 */
router.post('/create-upload', async (req, res) => {
  try {
    const { userId, meetingTitle } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    // Check if user already has an active upload
    const existingUpload = recallDesktopService.getUploadByUserId(userId);
    if (existingUpload) {
      return res.status(409).json({
        error: 'You already have an active upload session',
        upload: {
          uploadId: existingUpload.uploadId,
          uploadToken: existingUpload.uploadToken,
          status: existingUpload.status,
        },
      });
    }

    // Create the SDK upload
    const uploadData = await recallDesktopService.createUpload({
      userId,
      meetingTitle: meetingTitle || `Meeting - ${new Date().toLocaleDateString()}`,
    });

    // Create Meeting record in database
    if (mongoose.connection.readyState === 1) {
      try {
        const meeting = new Meeting({
          userId,
          botId: uploadData.uploadId, // Use uploadId as botId for consistency
          meetingUrl: 'desktop-recording', // No URL for desktop recordings
          botName: 'Desktop Recording',
          title: meetingTitle || `Meeting - ${new Date().toLocaleDateString()}`,
          status: 'active',
          recordingType: 'desktop', // Distinguish from bot recordings
        });
        await meeting.save();
        console.log(`✅ Meeting record created: ${meeting._id}`);
      } catch (dbError) {
        console.warn('⚠️ Failed to create meeting record:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'SDK upload token created. Enter this token in the Recall.ai Desktop app.',
      upload: uploadData,
    });
  } catch (error) {
    console.error('Error creating SDK upload:', error);
    res.status(500).json({
      error: error.message || 'Failed to create SDK upload',
    });
  }
});

/**
 * Get SDK upload status
 * GET /api/recall-desktop/upload-status/:uploadId
 */
router.get('/upload-status/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const status = await recallDesktopService.getUploadStatus(uploadId);

    if (!status) {
      return res.status(404).json({
        error: 'Upload not found',
      });
    }

    res.json({
      success: true,
      upload: status,
    });
  } catch (error) {
    console.error('Error getting upload status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get upload status',
    });
  }
});

/**
 * Cancel SDK upload
 * POST /api/recall-desktop/cancel-upload
 *
 * Body:
 *   - uploadId: Upload ID (optional if userId provided)
 *   - userId: User ID (optional if uploadId provided)
 */
router.post('/cancel-upload', async (req, res) => {
  try {
    const { uploadId, userId } = req.body;

    if (!uploadId && !userId) {
      return res.status(400).json({
        error: 'Upload ID or User ID is required',
      });
    }

    // Find upload by uploadId or userId
    let targetUploadId = uploadId;
    if (!targetUploadId && userId) {
      const upload = recallDesktopService.getUploadByUserId(userId);
      if (upload) {
        targetUploadId = upload.uploadId;
      }
    }

    if (!targetUploadId) {
      return res.status(404).json({
        error: 'Upload not found',
      });
    }

    const result = await recallDesktopService.cancelUpload(targetUploadId);

    // Update meeting status in database
    if (mongoose.connection.readyState === 1) {
      try {
        const meeting = await Meeting.findOne({ botId: targetUploadId });
        if (meeting) {
          meeting.status = 'canceled';
          meeting.endTime = new Date();
          await meeting.save();
          console.log(`✅ Meeting ${meeting._id} marked as canceled`);
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to update meeting status:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'SDK upload canceled',
      result,
    });
  } catch (error) {
    console.error('Error canceling upload:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel upload',
    });
  }
});

/**
 * Get all active SDK uploads (admin endpoint)
 * GET /api/recall-desktop/uploads
 */
router.get('/uploads', (req, res) => {
  try {
    const uploads = recallDesktopService.getAllUploads();

    res.json({
      success: true,
      count: uploads.length,
      uploads,
    });
  } catch (error) {
    console.error('Error getting uploads:', error);
    res.status(500).json({
      error: error.message || 'Failed to get uploads',
    });
  }
});

/**
 * Get user's active SDK upload
 * GET /api/recall-desktop/my-upload/:userId
 */
router.get('/my-upload/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const upload = recallDesktopService.getUploadByUserId(userId);

    if (!upload) {
      return res.status(404).json({
        error: 'No active upload found for this user',
      });
    }

    // Fetch live status from Recall.ai
    const liveStatus = await recallDesktopService.getUploadStatus(upload.uploadId);

    if (liveStatus) {
      upload.status = liveStatus.status?.code || liveStatus.status;
    }

    res.json({
      success: true,
      upload,
    });
  } catch (error) {
    console.error('Error getting user upload:', error);
    res.status(500).json({
      error: error.message || 'Failed to get upload',
    });
  }
});

export default router;
