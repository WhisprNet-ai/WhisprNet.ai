import mongoose from 'mongoose';

const SlackConfigSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  // Also store as string for easier querying
  organizationId: {
    type: String,
    required: true,
    index: true
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
    default: 'Slack Integration'
  },
  description: {
    type: String,
    default: 'Workspace communication insights via Slack'
  },
  // Slack App credentials
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  signingSecret: {
    type: String,
    required: true
  },
  // Bot Token (xoxb-...)
  botToken: {
    type: String,
    // Not required as it can be added later
  },
  // User/OAuth access token (xoxp-...)
  accessToken: {
    type: String,
    // This is the token we'll use for the users.list API call
  },
  // Workspace info (if available)
  teamId: {
    type: String,
  },
  teamName: {
    type: String,
  },
  teamDomain: {
    type: String,
  },
  botUserId: {
    type: String,
  },
  // Scopes requested
  scopes: {
    type: [String],
    default: [
      'channels:history',
      'channels:read',
      'chat:write',
      'emoji:read',
      'reactions:read',
      'team:read',
      'users:read',
      'users:read.email',
      'im:read',
      'im:write'
    ]
  },
  // Configuration for admin DM delivery
  adminUserId: {
    type: String, 
    description: 'Slack user ID of the admin to receive whispers'
  },
  defaultDeliveryChannel: {
    type: String,
    default: 'general',
    description: 'Default channel to deliver whispers if admin DM fails'
  },
  // Slack app name and description
  appName: {
    type: String,
    default: 'WhisprNet.ai'
  },
  appDescription: {
    type: String,
    default: 'WhisprNet.ai Slack Metadata Insights'
  },
  // Events API configuration
  eventsApiEnabled: {
    type: Boolean,
    default: false
  },
  eventsApiRequestUrl: {
    type: String
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
SlackConfigSchema.methods.toSanitized = function() {
  const obj = this.toObject();
  // Remove sensitive fields
  delete obj.clientSecret;
  delete obj.signingSecret;
  delete obj.stateSecret;
  delete obj.botToken;
  delete obj.accessToken;
  
  return {
    ...obj,
    clientIdMasked: obj.clientId ? `${obj.clientId.substring(0, 5)}...` : null,
    botTokenMasked: obj.botToken ? `${obj.botToken.substring(0, 9)}...` : null,
    accessTokenMasked: obj.accessToken ? `${obj.accessToken.substring(0, 9)}...` : null,
    isConfigured: !!(obj.clientId && obj.clientSecret && obj.signingSecret && (obj.botToken || obj.accessToken))
  };
};

const SlackConfig = mongoose.model('SlackConfig', SlackConfigSchema);

export default SlackConfig; 