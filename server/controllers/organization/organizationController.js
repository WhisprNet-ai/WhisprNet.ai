import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

// @desc    Create a new organization
// @route   POST /api/organizations
// @access  Public (but will require admin confirmation in production)
export const createOrganization = async (req, res, next) => {
  try {
    const { name, domain, adminEmail, adminName } = req.body;

    // Check if org with this name already exists
    const existingOrg = await Organization.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: 'Organization with this name already exists'
      });
    }

    // Create organization
    const organization = await Organization.create({
      name,
      domain: domain || undefined
    });

    // Create initial admin user
    const { firstName, lastName, email, password } = req.body;
    
    const user = await User.create({
      organizationId: organization._id,
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isEmailVerified: true // In a real app, this would be false and verified through email
    });

    res.status(201).json({
      success: true,
      data: {
        organization,
        apiKey: organization.apiKey,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all organizations (admin endpoint)
// @route   GET /api/organizations
// @access  Private/Admin
export const getOrganizations = async (req, res, next) => {
  try {
    // Check if we should include inactive organizations
    const includeInactive = req.query.includeInactive === 'true';
    
    // Build the filter
    const filter = includeInactive ? {} : { isActive: true };
    
    const organizations = await Organization.find(filter);

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single organization
// @route   GET /api/organizations/:id
// @access  Private
export const getOrganization = async (req, res, next) => {
  try {
    // Check tenant isolation
    if (req.user.role !== 'admin' && req.user.organizationId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization'
      });
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current organization
// @route   GET /api/organizations/current
// @access  Private
export const getCurrentOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private/Admin or Org Admin
export const updateOrganization = async (req, res, next) => {
  try {
    // Check tenant isolation
    if (req.user.role !== 'admin' && req.user.organizationId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this organization'
      });
    }

    const { name, domain } = req.body;

    // Check if org with this name already exists (except current org)
    if (name) {
      const existingOrg = await Organization.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
      
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          error: 'Organization with this name already exists'
        });
      }
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete organization (soft delete by updating status)
// @route   DELETE /api/organizations/:id
// @access  Private/Admin
export const deleteOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Soft delete - set isActive to false
    organization.isActive = false;
    
    // Also mark subscription as inactive if it exists
    if (organization.subscription) {
      organization.subscription.status = 'inactive';
    }
    
    await organization.save();

    // Handle cascade updates for related entities
    // Update users associated with this organization if needed
    // await User.updateMany({ organizationId: req.params.id }, { isActive: false });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization API key (regenerate if requested)
// @route   GET /api/organizations/:id/apikey
// @access  Private/OrgAdmin
export const getOrganizationApiKey = async (req, res, next) => {
  try {
    // Check tenant isolation
    if (req.user.role !== 'admin' && req.user.organizationId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization API key'
      });
    }

    const { regenerate } = req.query;
    const organization = await Organization.findById(req.params.id).select('+apiKey');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Regenerate API key if requested
    if (regenerate === 'true') {
      organization.apiKey = `org_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await organization.save();
    }

    res.status(200).json({
      success: true,
      data: {
        apiKey: organization.apiKey
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate organization API key
// @route   POST /api/organizations/:id/apikey/regenerate
// @access  Private/Admin
export const regenerateApiKey = async (req, res, next) => {
  try {
    // Check tenant isolation
    if (req.user.role !== 'admin' && req.user.organizationId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to regenerate this organization API key'
      });
    }

    const newApiKey = nanoid(32);

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { apiKey: newApiKey },
      { new: true }
    ).select('+apiKey');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        apiKey: organization.apiKey
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization members
// @route   GET /api/organizations/:id/members
// @access  Private
export const getOrganizationMembers = async (req, res, next) => {
  try {
    // Debug information
    console.log('GET MEMBERS REQUEST::::::::', {
      userId: req.user._id,
      userRole: req.user.role,
      userOrgId: req.user.organizationId,
      requestedOrgId: req.params.id
    });
    
    // Handle 'current' organization
    const organizationId = req.params.id === 'current' ? req.user.organizationId : req.params.id;
    
    console.log('Using organization ID:', organizationId);
    console.log('User role:', req.user.role);
    console.log('User organization ID:', req.user.organizationId);
    // Check tenant isolation (only for specific organization IDs, not 'current')
    if (req.params.id !== 'current' && 
        req.user.role !== 'admin' && 
        req.user.organizationId.toString() !== organizationId) {
      console.log('FORBIDDEN: Tenant isolation check failed');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization'
      });
    }

    // Query for members
    const members = await User.find({ organizationId })
      .select('-password -resetPasswordToken -resetPasswordExpire');
      
    console.log(`Found ${members.length} members for organization ${organizationId}`);
    
    // Ensure consistent response format for both front and backend
    return res.status(200).json({
      success: true,
      count: members.length,
      members: members
    });
  } catch (error) {
    console.error('Error in getOrganizationMembers:', error);
    next(error);
  }
};

// @desc    Get organization settings
// @route   GET /api/organizations/current/settings
// @access  Private
export const getOrganizationSettings = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Get admin user
    const adminUser = await User.findOne({
      organizationId: req.user.organizationId,
      role: { $in: ['admin', 'owner'] }
    }).sort({ createdAt: 1 }); // Get the oldest admin/owner

    // Format settings for response
    const settings = {
      organizationName: organization.name,
      adminEmail: adminUser ? adminUser.email : '',
      notificationsEnabled: organization.settings?.notificationSettings?.email?.enabled || true,
      emailDigest: organization.settings?.notificationSettings?.email?.digestFrequency || 'daily',
      accessControl: organization.settings?.accessControl || 'team-leads',
      auditLogs: organization.settings?.auditLogs || true,
      dataRetentionDays: organization.settings?.dataRetention?.days || 90,
      theme: organization.settings?.theme || 'dark'
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organization settings
// @route   PUT /api/organizations/current/settings
// @access  Private
export const updateOrganizationSettings = async (req, res, next) => {
  try {
    const {
      organizationName,
      notificationsEnabled,
      emailDigest,
      accessControl,
      auditLogs,
      dataRetentionDays,
      theme
    } = req.body;

    // Check if user has permissions to update settings
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update organization settings'
      });
    }

    // Check if org with this name already exists (except current org)
    if (organizationName) {
      const existingOrg = await Organization.findOne({
        _id: { $ne: req.user.organizationId },
        name: { $regex: new RegExp(`^${organizationName}$`, 'i') }
      });
      
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          error: 'Organization with this name already exists'
        });
      }
    }

    // Get current organization
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Update organization settings
    if (organizationName) organization.name = organizationName;

    // Update notification settings
    if (organization.settings === undefined) organization.settings = {};
    if (organization.settings.notificationSettings === undefined) {
      organization.settings.notificationSettings = {
        email: { enabled: true, digestFrequency: 'daily' },
        slack: { enabled: false }
      };
    }

    if (notificationsEnabled !== undefined) {
      organization.settings.notificationSettings.email.enabled = notificationsEnabled;
    }

    if (emailDigest) {
      organization.settings.notificationSettings.email.digestFrequency = emailDigest;
    }

    // Update other settings
    if (accessControl) organization.settings.accessControl = accessControl;
    if (auditLogs !== undefined) organization.settings.auditLogs = auditLogs;
    if (dataRetentionDays) {
      if (!organization.settings.dataRetention) organization.settings.dataRetention = {};
      organization.settings.dataRetention.days = dataRetentionDays;
    }
    if (theme) organization.settings.theme = theme;

    await organization.save();

    // Get admin user
    const adminUser = await User.findOne({
      organizationId: req.user.organizationId,
      role: { $in: ['admin', 'owner'] }
    }).sort({ createdAt: 1 }); // Get the oldest admin/owner

    // Format updated settings for response
    const updatedSettings = {
      organizationName: organization.name,
      adminEmail: adminUser ? adminUser.email : '',
      notificationsEnabled: organization.settings?.notificationSettings?.email?.enabled,
      emailDigest: organization.settings?.notificationSettings?.email?.digestFrequency,
      accessControl: organization.settings?.accessControl,
      auditLogs: organization.settings?.auditLogs,
      dataRetentionDays: organization.settings?.dataRetention?.days,
      theme: organization.settings?.theme
    };

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organization subscription info
// @route   GET /api/organizations/current/subscription
// @access  Private
export const getSubscription = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Format subscription for response
    const subscription = {
      plan: organization.subscription?.plan || 'free',
      status: organization.subscription?.status || 'active',
      renewalDate: organization.subscription?.endDate,
      billingCycle: organization.subscription?.billingCycle || 'monthly',
      customerId: organization.subscription?.customerId,
      subscriptionId: organization.subscription?.subscriptionId,
      paymentMethod: {
        type: 'card',
        last4: organization.subscription?.paymentMethod?.last4 || '',
        expiry: organization.subscription?.paymentMethod?.expiry || ''
      }
    };

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organization subscription
// @route   PUT /api/organizations/current/subscription
// @access  Private/Admin
export const updateSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;

    // Check if user has permissions to update subscription
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update organization subscription'
      });
    }

    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // In a real implementation, this would interact with a payment processor
    // like Stripe to update the subscription

    // Update subscription plan
    if (!organization.subscription) {
      organization.subscription = {
        plan: plan || 'free',
        status: 'active',
        startDate: new Date(),
        billingCycle: 'monthly'
      };
    } else {
      organization.subscription.plan = plan || organization.subscription.plan;
      organization.subscription.status = 'active';
    }

    await organization.save();

    // Format updated subscription for response
    const updatedSubscription = {
      plan: organization.subscription.plan,
      status: organization.subscription.status,
      renewalDate: organization.subscription.endDate,
      billingCycle: organization.subscription.billingCycle,
      customerId: organization.subscription.customerId,
      subscriptionId: organization.subscription.subscriptionId
    };

    res.status(200).json({
      success: true,
      data: updatedSubscription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel organization subscription
// @route   DELETE /api/organizations/current/subscription
// @access  Private/Admin
export const cancelSubscription = async (req, res, next) => {
  try {
    // Check if user has permissions to cancel subscription
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel organization subscription'
      });
    }

    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // In a real implementation, this would interact with a payment processor
    // like Stripe to cancel the subscription

    // Update subscription status
    if (organization.subscription) {
      organization.subscription.status = 'cancelled';
      await organization.save();
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 