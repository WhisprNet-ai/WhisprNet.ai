import mongoose from 'mongoose';

const GithubConfigSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  // Status of the integration 
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'failed'],
    default: 'pending'
  },
  // Integration name and description
  name: {
    type: String,
    default: 'GitHub Integration'
  },
  description: {
    type: String,
    default: 'Repository collaboration insights via GitHub'
  },
  // GitHub App credentials
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  appId: {
    type: String,
    required: true
  },
  privateKey: {
    type: String,
    required: true
  },
  webhookSecret: {
    type: String,
    required: true
  },
  // Webhook configuration
  webhookEnabled: {
    type: Boolean,
    default: false
  },
  webhookUrl: {
    type: String,
    default: function() {
      return `${process.env.API_URL}/api/github/events`;
    }
  },
  // Credentials from OAuth flow
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  // GitHub organization info
  githubOrgName: {
    type: String,
  },
  githubOrgId: {
    type: String,
  },
  // GitHub App installation info
  installationId: {
    type: String,
  },
  setupAction: {
    type: String,
    enum: ['install', 'update', 'uninstall', null],
    default: null
  },
  // Events to subscribe to
  subscribedEvents: {
    type: [String],
    default: [
      'push',
      'pull_request',
      'issues',
      'issue_comment'
    ]
  },
  // Last verification status and timestamp
  verifiedAt: {
    type: Date
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'pending', 'failed', null],
    default: null
  },
  verificationError: {
    type: String
  },
  // Webhook setup status
  webhookSetupStatus: {
    type: String,
    enum: ['setup', 'pending', 'failed', null],
    default: null
  },
  webhookSetupError: {
    type: String
  },
  // Synchronization tracking
  lastSyncedAt: {
    type: Date
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

// Method to get sanitized version (without sensitive credentials)
GithubConfigSchema.methods.toSanitized = function() {
  const obj = this.toObject();
  // Remove sensitive fields
  delete obj.clientSecret;
  delete obj.privateKey;
  delete obj.webhookSecret;
  delete obj.accessToken;
  delete obj.refreshToken;
  
  return {
    ...obj,
    clientIdMasked: obj.clientId ? `${obj.clientId.substring(0, 5)}...` : null,
    privateKeyMasked: obj.privateKey ? '********' : null,
    accessTokenMasked: obj.accessToken ? `${obj.accessToken.substring(0, 9)}...` : null,
    isConfigured: !!(obj.clientId && obj.clientSecret && obj.appId && obj.privateKey && obj.webhookSecret)
  };
};

const GithubConfig = mongoose.model('GithubConfig', GithubConfigSchema);

export default GithubConfig; 