import mongoose from 'mongoose';

const WhisprLogSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  channel: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['insight', 'warning', 'suggestion', 'alert'],
    default: 'insight'
  },
  suggestedActions: [{
    type: String
  }],
  delivered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for query performance
WhisprLogSchema.index({ organization: 1, createdAt: -1 });
WhisprLogSchema.index({ channel: 1 });
WhisprLogSchema.index({ category: 1, priority: 1 });

const WhisprLog = mongoose.model('WhisprLog', WhisprLogSchema);

export default WhisprLog; 