import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectDatabase } from './config/database.js';

// Import routes
import healthRouter from './routes/health.js';
import transcriptionRouter from './routes/transcription.js';
import summaryRouter from './routes/summary.js';
import voiceRouter from './routes/voice.js';
import twinRouter from './routes/twin.js';

// Import services and models
import deepgramService from './services/deepgramService.js';
import Meeting from './models/Meeting.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/transcription', transcriptionRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/twin', twinRouter);

// Store WebSocket metadata for each connection
const wsClients = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  // Initialize client metadata
  const clientId = Math.random().toString(36).substring(7);
  wsClients.set(ws, { clientId, meetingId: null });

  ws.on('message', async (message) => {
    try {
      // Handle binary audio data
      if (message instanceof Buffer) {
        const metadata = wsClients.get(ws);
        if (metadata?.meetingId) {
          // Send audio to Deepgram
          deepgramService.sendAudio(metadata.meetingId, message);
        }
        return;
      }

      // Handle JSON messages
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data.type);

      // Handle different message types
      switch (data.type) {
        case 'start_transcription': {
          const { userId } = data;

          if (!userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'userId is required'
            }));
            return;
          }

          // Create new meeting in database (if connected)
          let meeting = null;
          let meetingId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          if (mongoose.connection.readyState === 1) {
            try {
              meeting = new Meeting({
                userId,
                title: data.title || 'Untitled Meeting',
                status: 'active'
              });
              await meeting.save();
              meetingId = meeting._id.toString();
              console.log('✅ Meeting saved to database:', meetingId);
            } catch (dbError) {
              console.warn('⚠️ Failed to save meeting to DB, continuing without persistence:', dbError.message);
            }
          } else {
            console.warn('⚠️ MongoDB not connected, transcription will work without persistence');
          }

          // Store meeting ID for this connection
          const metadata = wsClients.get(ws);
          metadata.meetingId = meetingId;

          // Create Deepgram connection
          await deepgramService.createLiveTranscription(
            meetingId,
            // On transcript callback
            async (result) => {
              // Only save final transcripts to database
              if (result.isFinal && meeting) {
                try {
                  meeting.transcriptions.push({
                    speaker: 'user', // TODO: Implement speaker detection
                    text: result.text,
                    confidence: result.confidence,
                    timestamp: result.timestamp
                  });
                  await meeting.save();
                } catch (dbError) {
                  console.warn('⚠️ Failed to save transcription to DB:', dbError.message);
                }
              }

              // Send to frontend (both interim and final)
              ws.send(JSON.stringify({
                type: 'transcription',
                data: {
                  text: result.text,
                  isFinal: result.isFinal,
                  confidence: result.confidence,
                  timestamp: result.timestamp,
                  speaker: 'user'
                }
              }));
            },
            // On error callback
            (error) => {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Transcription error: ' + error.message
              }));
            }
          );

          ws.send(JSON.stringify({
            type: 'transcription_started',
            meetingId: meetingId
          }));

          console.log(`Started transcription for meeting ${meetingId}`);
          break;
        }

        case 'stop_transcription': {
          const metadata = wsClients.get(ws);

          if (metadata?.meetingId) {
            // Close Deepgram connection
            deepgramService.closeTranscription(metadata.meetingId);

            // Update meeting status in DB if connected and not a temp ID
            if (mongoose.connection.readyState === 1 && !metadata.meetingId.startsWith('temp-')) {
              try {
                const meeting = await Meeting.findById(metadata.meetingId);
                if (meeting) {
                  meeting.status = 'ended';
                  meeting.endTime = new Date();
                  await meeting.save();
                  console.log('✅ Meeting status updated in database');
                }
              } catch (dbError) {
                console.warn('⚠️ Failed to update meeting in DB:', dbError.message);
              }
            }

            ws.send(JSON.stringify({
              type: 'transcription_stopped',
              meetingId: metadata.meetingId
            }));

            console.log(`Stopped transcription for meeting ${metadata.meetingId}`);
            metadata.meetingId = null;
          }
          break;
        }

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    const metadata = wsClients.get(ws);

    // Clean up Deepgram connection if exists
    if (metadata?.meetingId) {
      deepgramService.closeTranscription(metadata.meetingId);
    }

    wsClients.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 EchoTwin backend server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
