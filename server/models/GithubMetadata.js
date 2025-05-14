import mongoose from 'mongoose';

const GithubMetadataSchema = new mongoose.Schema({
  // Core fields
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  source: {
    type: String,
    default: 'github'
  },
  metadata_type: {
    type: String,
    enum: ['commit_activity', 'pr_lifecycle', 'issue_tracking', 'code_review', 'development_activity'],
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  
  // Repository info
  repoName: {
    type: String
  },
  repoId: {
    type: String
  },
  
  // Action performers
  senderId: {
    type: String
  },
  senderType: {
    type: String
  },
  
  // Common event fields (may be present in different event types)
  ref: String,
  refType: String,
  branchName: String,
  isDefaultBranch: Boolean,
  
  // Push/Commit specific
  commitCount: Number,
  
  // PR specific
  prNumber: Number,
  prAction: String,
  prState: String,
  baseBranch: String,
  headBranch: String,
  isDraft: Boolean,
  isMerged: Boolean,
  additionsCount: Number,
  deletionsCount: Number,
  changedFilesCount: Number,
  reviewCount: Number,
  
  // Issue specific
  issueNumber: Number,
  issueAction: String,
  issueState: String,
  issueLabels: [String],
  hasAssignees: Boolean,
  commentCount: Number,
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String
  },
  processedAt: {
    type: Date
  },
  
  // Raw data for debugging (optional)
  rawData: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Create indexes for common queries
GithubMetadataSchema.index({ organizationId: 1, processingStatus: 1 });
GithubMetadataSchema.index({ timestamp: -1 });
GithubMetadataSchema.index({ eventType: 1, organizationId: 1 });
GithubMetadataSchema.index({ metadata_type: 1, organizationId: 1 });

const GithubMetadata = mongoose.model('GithubMetadata', GithubMetadataSchema);

export default GithubMetadata; 