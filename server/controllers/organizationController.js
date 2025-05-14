import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import SlackConfig from '../models/SlackConfig.js';
import { WebClient } from '@slack/web-api';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHandler.js';

/**
 * @desc    Get organization members
 * @route   GET /api/organizations/:organizationId/members
 * @access  Private - All authenticated users
 */
export const getOrganizationMembers = asyncHandler(async (req, res) => {
  // Handle 'current' organization ID parameter
  const { organizationId } = req.params;
  const userOrgId = req.user.organizationId;
  
  // Debug information
  console.log('GET MEMBERS REQUEST:', {
    userId: req.user._id,
    userRole: req.user.role,
    userOrgId,
    requestedOrgId: organizationId
  });
  
  // Determine which organization ID to use
  const targetOrgId = organizationId === 'current' ? userOrgId : organizationId;
  
  console.log('Using organization ID:', targetOrgId);
  
  // Check tenant isolation (only for specific organization IDs, not 'current')
  if (organizationId !== 'current' && 
      req.user.role !== 'super_admin' && 
      userOrgId.toString() !== targetOrgId) {
    console.log('FORBIDDEN: Tenant isolation check failed');
    return sendError(res, 'Not authorized to access this organization', 403);
  }

  try {
    // Check if organization exists
    const organization = await Organization.findById(targetOrgId);
    
    if (!organization) {
      return sendNotFound(res, 'Organization not found');
    }
    
    // Fetch members from the database
    const dbMembers = await User.find({ 
      organizationId: targetOrgId,
      isActive: true
    }).select('-password -resetPasswordToken -resetPasswordExpire');
    
    console.log(`Found ${dbMembers.length} database members for organization ${targetOrgId}`);
    
    // Create a map to track all members by email (to avoid duplicates)
    const membersByEmail = new Map();
    
    // Add database members to the map
    dbMembers.forEach(member => {
      if (member.email) {
        membersByEmail.set(member.email.toLowerCase(), {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          role: member.role,
          source: 'database'
        });
      }
    });
    
    // Check for active Slack integration
    const slackConfig = await SlackConfig.findOne({
      organization: targetOrgId,
      status: 'active'
    });
    
    // If Slack is configured, fetch users from Slack API
    if (slackConfig && slackConfig.botToken) {
      try {
        console.log('Found active Slack integration, fetching Slack users');
        const slackClient = new WebClient(slackConfig.botToken);
        
        // Call Slack API to get users
        const slackResponse = await slackClient.users.list();
        
        if (slackResponse.ok) {
          // Filter and process Slack users
          const slackUsers = slackResponse.members
            .filter(member => !member.is_bot && !member.deleted && member.id !== 'USLACKBOT' && member.profile?.email)
            .map(member => ({
              _id: `slack_${member.id}`,
              firstName: member.profile?.first_name || member.real_name?.split(' ')[0] || 'Slack',
              lastName: member.profile?.last_name || member.real_name?.split(' ').slice(1).join(' ') || 'User',
              email: member.profile.email,
              role: 'external_user',
              slackId: member.id,
              avatar: member.profile?.image_48,
              source: 'slack'
            }));
          
          console.log(`Found ${slackUsers.length} users from Slack integration`);
          
          // Add Slack users to the map if they don't already exist in the database
          slackUsers.forEach(slackUser => {
            if (slackUser.email && !membersByEmail.has(slackUser.email.toLowerCase())) {
              membersByEmail.set(slackUser.email.toLowerCase(), slackUser);
            }
          });
        } else {
          console.error('Error from Slack API:', slackResponse.error);
        }
      } catch (slackError) {
        console.error('Error fetching Slack users:', slackError);
      }
    }
    
    // TODO: Add more integrations here (GitHub, Microsoft Teams, etc.)
    
    // Convert the map back to an array
    const allMembers = Array.from(membersByEmail.values());
    
    console.log(`Returning ${allMembers.length} total members (database + integrations)`);
    
    // Return members data
    return sendSuccess(res, 'Organization members retrieved successfully', { 
      count: allMembers.length,
      members: allMembers
    });
  } catch (err) {
    console.error('Error in getOrganizationMembers:', err);
    return sendError(res, 'Failed to retrieve organization members', 500);
  }
});

// Export all controller functions
export default {
  getOrganizationMembers
}; 