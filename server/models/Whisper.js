import mongoose from 'mongoose';

const WhisperSchema = new mongoose.Schema({
  whisperId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  source: {
    type: String,
    enum: ['agent', 'manual', 'api'],
    default: 'agent'
  },
  // Primary organization reference field
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
    alias: 'organization' // Alias for compatibility with previous WhisprLog references
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['improvement', 'optimization', 'health', 'collaboration', 'recognition', 'insight', 'warning', 'suggestion', 'alert'],
    default: 'improvement',
    index: true
  },
  // Single field for priority (numeric)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
    index: true,
    get: function() {
      return this._priority;
    },
    set: function(val) {
      // Also update priorityText when priority is set
      this._priority = val;
      if (val === 1) this.priorityText = 'critical';
      else if (val === 2) this.priorityText = 'high';
      else if (val === 3) this.priorityText = 'medium';
      else this.priorityText = 'low';
      return val;
    }
  },
  // Human readable priority text
  priorityText: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Consolidated content structure
  content: {
    message: {
      type: String,
      required: true
    },
    suggestedActions: [{
      type: String
    }],
    rationale: String
  },
  // Scope information for team managers
  scopeInfo: {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    scopeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsightScope',
      index: true
    },
    integration: String,
    sourceItems: [{
      itemId: String,
      itemType: String
    }]
  },
  // Delivery tracking fields
  channel: {
    type: String,
    default: 'admin_dm'
  },
  delivered: {
    type: Boolean,
    default: false
  },
  metadata: {
    agentSessionId: String,
    generatedBy: String,
    generatedAt: Date,
    modelName: String,
    traceId: {
      type: String,
      index: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.75
    },
    dataPoints: mongoose.Schema.Types.Mixed,
    source: String  // For tracking integration source
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'archived'],
    default: 'pending',
    index: true
  },
  feedback: {
    isHelpful: {
      type: Boolean,
      default: null
    },
    comment: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  // Enable virtuals in object and JSON
  toObject: { virtuals: true, getters: true },
  toJSON: { virtuals: true, getters: true }
});

// Backwards compatibility virtuals
WhisperSchema.virtual('message').get(function() {
  return this.content?.message;
});

WhisperSchema.virtual('suggestedActions').get(function() {
  return this.content?.suggestedActions || [];
});

// For compatibility with old priorityString field
WhisperSchema.virtual('priorityString').get(function() {
  return this.priorityText;
});

// Add combined indexes for common query patterns
WhisperSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
WhisperSchema.index({ organizationId: 1, priority: 1, category: 1 });
WhisperSchema.index({ channel: 1 });
WhisperSchema.index({ 'scopeInfo.managerId': 1, status: 1 });

// Static method to get recent whispers
WhisperSchema.statics.getRecent = function(organizationId, limit = 10) {
  return this.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-metadata');
};

// Static method to get whispers for a manager
WhisperSchema.statics.getManagerWhispers = function(managerId, organizationId, limit = 10) {
  return this.find({ 
    organizationId,
    $or: [
      { 'scopeInfo.managerId': managerId },
      { 'scopeInfo.managerId': null } // Include org-wide whispers
    ] 
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-metadata');
};

// Pre-save hook to ensure whisper has a whisperId
WhisperSchema.pre('save', function(next) {
  if (!this.whisperId) {
    this.whisperId = `whspr_${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  
  // Set priorityText based on numeric priority if not already set
  if (this.priority !== undefined && !this.priorityText) {
    if (this.priority === 1) this.priorityText = 'critical';
    else if (this.priority === 2) this.priorityText = 'high';
    else if (this.priority === 3) this.priorityText = 'medium';
    else this.priorityText = 'low';
  }
  
  next();
});

const Whisper = mongoose.model('Whisper', WhisperSchema);

export default Whisper; 