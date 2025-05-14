import mongoose from 'mongoose';

const managerPermissionSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    allowedIntegrations: {
      type: [String],
      required: true,
      default: []
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create an index for faster lookups
managerPermissionSchema.index({ managerId: 1, organizationId: 1 }, { unique: true });

const ManagerPermission = mongoose.model('ManagerPermission', managerPermissionSchema);

export default ManagerPermission; 