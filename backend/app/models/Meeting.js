import mongoose from 'mongoose';

const transcriptionSchema = new mongoose.Schema({
  speaker: {
    type: String,
    required: true,
    default: 'Unknown'
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  }
});

const meetingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  botId: {
    type: String,
    index: true,
    sparse: true  // Allow null for meetings without bots
  },
  meetingUrl: {
    type: String
  },
  botName: {
    type: String,
    default: 'AI Assistant'
  },
  title: {
    type: String,
    default: 'Untitled Meeting'
  },
  // Recording type: 'bot' (Recall.ai bot joins meeting) or 'desktop' (local screen/audio recording)
  recordingType: {
    type: String,
    enum: ['bot', 'desktop'],
    default: 'bot'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  transcriptions: [transcriptionSchema],
  summary: {
    keyPoints: [String],
    actionItems: [{
      text: String,
      dueDate: Date,
      completed: Boolean
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
meetingSchema.index({ userId: 1, startTime: -1 });
meetingSchema.index({ botId: 1, userId: 1 });

export default mongoose.model('Meeting', meetingSchema);
