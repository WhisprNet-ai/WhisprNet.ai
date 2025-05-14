import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const InvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  token: {
    type: String,
    default: () => nanoid(32)
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  // Fields for organization invitations
  organizationName: {
    type: String,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'org_admin', 'team_manager', 'super_admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For team manager invitations
  allowedIntegrations: {
    type: [String],
    default: []
  },
  // Track invitation actions
  history: [{
    action: {
      type: String,
      enum: ['created', 'resent', 'expired', 'accepted', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Check if invitation has expired
InvitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Add history record when creating a new invitation
InvitationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.history = [{
      action: 'created',
      timestamp: new Date(),
      by: this.createdBy
    }];
  }
  next();
});

// Create proper indexes
InvitationSchema.index({ email: 1, organizationId: 1, status: 1 }); // Only one pending invitation per email+org
InvitationSchema.index({ token: 1 }); // For looking up by token
InvitationSchema.index({ status: 1, expiresAt: 1 }); // For cleaning up expired invitations

const Invitation = mongoose.model('Invitation', InvitationSchema);

export default Invitation; 