import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

/**
 * Organization Schema
 * Represents a company/organization in the multi-tenant system
 */
const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^(?!:\/\/)(?!www\.)(?:[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.)+[a-zA-Z]{2,}$/,
      'Please provide a valid domain'
    ]
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => nanoid(32)
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trialing', 'pastDue', 'canceled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    trialEndsAt: {
      type: Date
    },
    customerId: String,
    subscriptionId: String
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
      default: 'en'
    },
    notificationSettings: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        digestFrequency: {
          type: String,
          enum: ['realtime', 'daily', 'weekly'],
          default: 'daily'
        }
      },
      slack: {
        enabled: {
          type: Boolean,
          default: false
        },
        channelId: String
      }
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  contactInfo: {
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for number of members
OrganizationSchema.virtual('memberCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

// Middleware to generate slug if not provided
OrganizationSchema.pre('save', function(next) {
  if (!this.slug) {
    // Create a slug from the name
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    // Add a random suffix to ensure uniqueness
    this.slug = `${this.slug}-${nanoid(6)}`;
  }
  next();
});

// Remove sensitive data when converting to JSON
OrganizationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.apiKey;
  return obj;
};

// Static method to get organization by API key
OrganizationSchema.statics.findByApiKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

// Static method to find by domain
OrganizationSchema.statics.findByDomain = function(domain) {
  return this.findOne({ domain, isActive: true });
};

const Organization = mongoose.model('Organization', OrganizationSchema);

export default Organization; 