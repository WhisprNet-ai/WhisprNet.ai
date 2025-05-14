import mongoose from 'mongoose';

const AgentSessionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  agentType: {
    type: String,
    enum: ['pulse', 'intel', 'sentinel', 'whispr'],
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  metadata: {
    // Store agent-specific runtime metadata
    integrations: [String],
    parameters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    contextSize: Number,
    modelName: String,
    systemPromptTokens: Number,
    totalTokensUsed: Number
  },
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'debug']
    },
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],
  inputs: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  outputs: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for performance optimization
AgentSessionSchema.index({ organizationId: 1, agentType: 1 });
AgentSessionSchema.index({ sessionId: 1 });
AgentSessionSchema.index({ startTime: -1 });
AgentSessionSchema.index({ status: 1 });

const AgentSession = mongoose.model('AgentSession', AgentSessionSchema);

export default AgentSession; 