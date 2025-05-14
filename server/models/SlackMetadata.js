import mongoose from 'mongoose';
const { Schema } = mongoose;

const SlackMetadataSchema = new Schema({
  // Event identification
  eventId: {
    type: String,
    required: true,
    index: true
  },
  source: {
    type: String,
    default: 'slack',
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  subtype: String,
  
  // Time tracking
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processed', 'skipped'],
    default: 'pending',
    index: true
  },
  
  // Tenant isolation
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  teamId: {
    type: String,
    index: true
  },
  
  // Event context
  channelId: String,
  userId: String,
  
  // Scope matching information
  scopeMatches: [{
    scopeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsightScope'
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Message metadata (no content)
  messageLength: Number,
  hasAttachments: Boolean,
  hasEmoji: Boolean,
  isInThread: Boolean,
  threadTs: String,
  hasEdits: Boolean,
  channelType: String,
  isDM: Boolean,
  
  // Time analysis fields
  hourOfDay: Number,
  timeCategory: {
    type: String,
    enum: ['late_night', 'early_morning', 'work_hours', 'evening'],
  },
  dayOfWeek: Number, // 0 = Sunday, 6 = Saturday
  isWeekend: Boolean,
  
  // System metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
}, {
  timestamps: true
});

// Compound indexes for query optimization
SlackMetadataSchema.index({ organizationId: 1, processingStatus: 1, timestamp: 1 });
SlackMetadataSchema.index({ organizationId: 1, eventType: 1, timestamp: 1 });
SlackMetadataSchema.index({ 'scopeMatches.managerId': 1, organizationId: 1 });

// TTL index to auto-expire processed data after 30 days (if needed)
// SlackMetadataSchema.index({ processedAt: 1 }, { expireAfterSeconds: 2592000 });

const SlackMetadata = mongoose.model('SlackMetadata', SlackMetadataSchema);

export default SlackMetadata; 