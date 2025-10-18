import express from 'express';
import aiService from '../services/aiService.js';
import Meeting from '../models/Meeting.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get meeting summary from database
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // If MongoDB is connected, fetch from database
    if (mongoose.connection.readyState === 1) {
      const meeting = await Meeting.findById(meetingId);

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // If summary exists, return it
      if (meeting.summary) {
        return res.json({
          meetingId,
          summary: meeting.summary
        });
      }

      // If no summary but has transcriptions, generate one
      if (meeting.transcriptions && meeting.transcriptions.length > 0) {
        const summary = await aiService.generateSummary(meeting.transcriptions);

        // Save summary to database
        meeting.summary = summary;
        await meeting.save();

        return res.json({
          meetingId,
          summary
        });
      }
    }

    // Return empty summary if no data
    res.json({
      meetingId,
      summary: {
        summary: 'No transcriptions available yet',
        keyPoints: [],
        actionItems: [],
        decisions: []
      }
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate summary from transcript array
router.post('/generate', async (req, res) => {
  try {
    const { meetingId, transcriptions } = req.body;

    if (!transcriptions || transcriptions.length === 0) {
      return res.status(400).json({
        error: 'Transcriptions are required'
      });
    }

    // Generate summary using Gemini
    const summary = await aiService.generateSummary(transcriptions);

    // If meetingId provided and DB connected, save to database
    if (meetingId && mongoose.connection.readyState === 1) {
      try {
        const meeting = await Meeting.findById(meetingId);
        if (meeting) {
          meeting.summary = summary;
          await meeting.save();
        }
      } catch (dbError) {
        console.warn('Failed to save summary to DB:', dbError.message);
      }
    }

    res.json({
      success: true,
      meetingId,
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export summary
router.post('/export', async (req, res) => {
  try {
    const { meetingId, format } = req.body;

    // TODO: Generate export file (PDF, JSON, etc.)
    res.json({
      success: true,
      downloadUrl: `/api/summary/download/${meetingId}`,
      format
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
