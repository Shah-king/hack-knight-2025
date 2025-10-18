import mongoose from 'mongoose';

const transcriptionSchema = new mongoose.Schema({
  speaker: {
    type: String,
    required: true,
    enum: ['user', 'ai_twin', 'other']
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
  title: {
    type: String,
    default: 'Untitled Meeting'
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

// Index for efficient queries
meetingSchema.index({ userId: 1, startTime: -1 });

export default mongoose.model('Meeting', meetingSchema);
