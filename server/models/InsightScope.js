import mongoose from 'mongoose';

const InsightScopeSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  integration: {
    type: String,
    enum: ['slack', 'teams', 'discord', 'gmail', 'github'],
    required: true
  },
  scopeItems: [{
    itemId: {
      type: String,
      required: true
    },
    itemType: {
      type: String,
      enum: ['user', 'channel', 'room', 'group'],
      required: true
    },
    displayName: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index for efficient querying
InsightScopeSchema.index({ managerId: 1, integration: 1 });
InsightScopeSchema.index({ organizationId: 1, integration: 1 });
InsightScopeSchema.index({ 'scopeItems.itemId': 1, integration: 1 });

export default mongoose.model('InsightScope', InsightScopeSchema); 