import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import ManagerPermission from '../models/ManagerPermission.js';
import SlackConfig from '../models/SlackConfig.js';
import { WebClient } from '@slack/web-api';
import { sendSuccess, sendError, sendNotFound, sendCreated } from '../utils/responseHandler.js';
import Organization from '../models/Organization.js';
import mongoose from 'mongoose';

/**
 * @desc    Assign manager role and permissions to a user
 * @route   POST /api/managers/assign
 * @access  Private - Org Admin only
 */
export const assignManagerRole = async (req, res) => {
  try {
    const { userId, allowedIntegrations } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    if (!allowedIntegrations || !Array.isArray(allowedIntegrations) || allowedIntegrations.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one integration must be allowed' });
    }
    
    // Validate user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format. Must be a valid MongoDB ObjectId.' 
      });
    }
    
    // Find the user to assign manager role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if the user belongs to the same organization as the requester
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot assign manager role to a user from a different organization' 
      });
    }
    
    // Update user role to team_manager if they're not an admin
    if (user.role !== 'admin' && user.role !== 'org_admin') {
      user.role = 'team_manager';
      await user.save();
    }
    
    // Check if manager permissions already exist
    let managerPermission = await ManagerPermission.findOne({ managerId: userId });
    
    if (managerPermission) {
      // Update existing permissions
      managerPermission.allowedIntegrations = allowedIntegrations;
      await managerPermission.save();
    } else {
      // Create new manager permissions
      managerPermission = new ManagerPermission({
        managerId: userId,
        organizationId: req.user.organizationId,
        allowedIntegrations
      });
      await managerPermission.save();
    }
    
    // Get updated manager data with populated fields
    const updatedManagerPermission = await ManagerPermission.findById(managerPermission._id)
      .populate('managerId', 'firstName lastName email profileImage slackUserId')
      .populate('organizationId', 'name');
    
    return res.status(200).json({
      success: true,
      message: 'Manager role assigned successfully',
      manager: updatedManagerPermission
    });
  } catch (error) {
    console.error('Error assigning manager role:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all manager permissions for an organization
 * @route   GET /api/managers/permissions
 * @access  Private - Org Admin only
 */
export const getManagerPermissions = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  
  const permissions = await ManagerPermission.find({ 
    organizationId,
    isActive: true
  }).populate('managerId', 'firstName lastName email');
  
  return sendSuccess(res, 'Manager permissions retrieved', { permissions });
});

/**
 * @desc    Get current user's manager permissions
 * @route   GET /api/managers/my-permissions
 * @access  Private - Team Manager only
 */
export const getMyPermissions = asyncHandler(async (req, res) => {
  const { organizationId, _id: userId } = req.user;
  
  const permission = await ManagerPermission.findOne({ 
    managerId: userId,
    organizationId,
    isActive: true
  });
  
  if (!permission) {
    return sendNotFound(res, 'No manager permissions found');
  }
  
  return sendSuccess(res, 'Your permissions retrieved successfully', { permission });
});

/**
 * @desc    Revoke manager role from a user
 * @route   DELETE /api/managers/:managerId
 * @access  Private - Org Admin only
 */
export const revokeManagerRole = async (req, res) => {
  try {
    const { managerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid manager ID format' 
      });
    }
    
    // Find the manager permission
    const managerPermission = await ManagerPermission.findOne({
      managerId,
      organizationId: req.user.organizationId
    });
    
    if (!managerPermission) {
      return res.status(404).json({ success: false, error: 'Manager not found' });
    }
    
    // Find the user and remove team_manager role
    const user = await User.findById(managerId);
    if (user && user.role === 'team_manager') {
      user.role = 'user';
      await user.save();
    }
    
    // Delete the manager permission
    await ManagerPermission.findByIdAndDelete(managerPermission._id);
    
    return res.status(200).json({
      success: true,
      message: 'Manager role revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking manager role:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get available integrations for the organization
 * @route   GET /api/managers/available-integrations
 * @access  Private - All authenticated users
 */
export const getAvailableIntegrations = asyncHandler(async (req, res) => {
  // This would normally query the database for connected integrations
  // Here we're returning a static list as an example
  const integrations = [
    { id: 'slack', name: 'Slack', description: 'Connect to your Slack workspace' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Connect to your MS Teams account' },
    { id: 'discord', name: 'Discord', description: 'Connect to your Discord server' },
    { id: 'gmail', name: 'Gmail', description: 'Connect to your Gmail account' },
    { id: 'github', name: 'GitHub', description: 'Connect to your GitHub repositories' }
  ];
  
  return sendSuccess(res, 'Available integrations retrieved', { integrations });
});

/**
 * @desc    Get current user's integration connections
 * @route   GET /api/managers/my-connections
 * @access  Private - Team Manager only
 */
export const getMyConnections = asyncHandler(async (req, res) => {
  const { organizationId, _id: userId } = req.user;
  
  // This would normally query the database for user's integration connections
  // Here we're returning a static response as an example
  const connections = [
    { integration: 'slack', connected: true, lastSynced: new Date() },
    { integration: 'github', connected: true, lastSynced: new Date() }
  ];
  
  return sendSuccess(res, 'Your connections retrieved successfully', { connections });
});

/**
 * @desc    Get Slack users for organization
 * @route   GET /api/organizations/:organizationId/integrations/slack/users
 * @access  Private - Org Admin and Team Manager
 */
export const getSlackUsers = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const userOrgId = req.user.organizationId;
  
  // Ensure user can only access their own organization
  if (organizationId !== 'current' && organizationId !== userOrgId) {
    return sendError(res, 403, 'You do not have permission to access this organization');
  }
  
  try {
    // Get Slack config for this organization
    const slackConfig = await SlackConfig.findOne({ organizationId: userOrgId });
    
    if (!slackConfig) {
      return sendError(res, 404, 'Slack integration not configured for this organization');
    }
    
    // Check for required credentials - prefer accessToken but can use botToken as well
    // Access token (xoxp) has broader permissions, bot token (xoxb) is more limited
    const token = slackConfig.accessToken || slackConfig.botToken;
    
    if (!token) {
      return sendError(res, 400, 'No valid Slack token found. Please configure your Slack integration.');
    }
    
    // Log token type for debugging (without revealing actual token)
    const tokenType = token.startsWith('xoxp-') ? 'User Token (xoxp)' : token.startsWith('xoxb-') ? 'Bot Token (xoxb)' : 'Unknown Token Type';
    console.log(`Using ${tokenType} to fetch Slack users`);
    
    // Initialize Slack Web Client with the organization's token
    const slackClient = new WebClient(token);
    
    // First verify the token has the required scope
    try {
      const authTest = await slackClient.auth.test();
      console.log('Auth test successful:', authTest.team, authTest.user);
    } catch (authError) {
      console.error('Slack auth test failed:', authError.message);
      return sendError(res, 401, `Authentication failed with Slack: ${authError.message}`);
    }
    
    // Call Slack API to get users list with pagination
    console.log('Fetching users from Slack API...');
    
    // Collect all users with pagination
    let allUsers = [];
    let cursor;
    let hasMore = true;
    
    while (hasMore) {
      const params = { limit: 200 }; // Get 200 users at a time (API maximum)
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const result = await slackClient.users.list(params);
      
      if (!result.ok) {
        console.error('Slack API error:', result.error);
        return sendError(res, 500, `Slack API error: ${result.error}`);
      }
      
      // Add users from this page to our collection
      allUsers = [...allUsers, ...result.members];
      
      // Check if we need to fetch more users
      hasMore = result.response_metadata && result.response_metadata.next_cursor && result.response_metadata.next_cursor.length > 0;
      if (hasMore) {
        cursor = result.response_metadata.next_cursor;
        console.log(`Fetching more users with cursor: ${cursor.substring(0, 10)}...`);
      }
    }
    
    // Filter and format users (we don't want bots and deactivated accounts)
    const users = allUsers
      .filter(user => !user.is_bot && !user.deleted && user.id !== 'USLACKBOT')
      .map(user => ({
        id: user.id,
        name: user.real_name || user.name,
        email: user.profile?.email,
        avatar: user.profile?.image_192 || user.profile?.image_72 || user.profile?.image_48 || user.profile?.image_24,
        is_admin: user.is_admin,
        title: user.profile?.title,
        status: user.profile?.status_text,
        tz: user.tz_label,
        presence: user.presence // may be undefined depending on token scope
      }));
    
    console.log(`Found ${users.length} active users in Slack workspace`);
    
    return sendSuccess(res, { users });
  } catch (error) {
    console.error('Error fetching Slack users:', error);
    
    // Check for specific error types for better error messages
    if (error.code === 'slack_webapi_platform_error') {
      // This is a Slack API error
      const slackError = error.data?.error || 'unknown_error';
      
      // Handle common Slack API errors
      switch (slackError) {
        case 'invalid_auth':
          return sendError(res, 401, 'Invalid authentication token. Please update your Slack integration.');
        case 'not_authed':
          return sendError(res, 401, 'No authentication token provided. Please update your Slack integration.');
        case 'token_expired':
          return sendError(res, 401, 'Authentication token expired. Please refresh your Slack integration.');
        case 'missing_scope':
          return sendError(res, 403, 'Token missing required scope. The token must have users:read scope.');
        case 'rate_limited':
          return sendError(res, 429, 'Rate limited by Slack API. Please try again later.');
        default:
          return sendError(res, 500, `Slack API error: ${slackError}`);
      }
    }
    
    return sendError(res, 500, `Error fetching Slack users: ${error.message}`);
  }
});

// Get all managers for an organization
export const getAllManagers = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    const managers = await ManagerPermission.find({ organizationId })
      .populate('managerId', 'firstName lastName email profileImage slackUserId')
      .populate('organizationId', 'name');
    
    return res.status(200).json({
      success: true,
      managers
    });
  } catch (error) {
    console.error('Error getting managers:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  assignManagerRole,
  getManagerPermissions,
  getMyPermissions,
  revokeManagerRole,
  getAvailableIntegrations,
  getMyConnections,
  getSlackUsers,
  getAllManagers
}; 