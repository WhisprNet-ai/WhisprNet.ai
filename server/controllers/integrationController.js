import asyncHandler from '../middleware/asyncHandler.js';
import SlackConfig from '../models/SlackConfig.js';
import { WebClient } from '@slack/web-api';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

/**
 * @desc    Configure Slack integration for an organization
 * @route   POST /api/organizations/:organizationId/integrations/slack/config
 * @access  Private - Org Admin only
 */
export const configureSlackIntegration = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { clientId, clientSecret, accessToken } = req.body;
  const userOrgId = req.user.organizationId;
  
  // Ensure user can only access their own organization
  if (organizationId !== 'current' && organizationId !== userOrgId) {
    return sendError(res, 403, 'You do not have permission to access this organization');
  }
  
  // Validate required fields
  if (!clientId || !clientSecret || !accessToken) {
    return sendError(res, 400, 'Client ID, Client Secret, and Access Token are required');
  }
  
  try {
    // Verify the token is valid by making a test API call
    const slackClient = new WebClient(accessToken);
    const authTest = await slackClient.auth.test();
    
    if (!authTest.ok) {
      return sendError(res, 400, `Invalid Slack credentials: ${authTest.error}`);
    }
    
    // Store workspace info from the auth test
    const teamId = authTest.team_id;
    const teamName = authTest.team;
    const botUserId = authTest.user_id;
    
    // Find existing config or create new one
    let slackConfig = await SlackConfig.findOne({ organizationId: userOrgId });
    
    if (slackConfig) {
      // Update existing config
      slackConfig.clientId = clientId;
      slackConfig.clientSecret = clientSecret;
      slackConfig.accessToken = accessToken;
      slackConfig.status = 'active';
      slackConfig.teamId = teamId;
      slackConfig.teamName = teamName;
      slackConfig.botUserId = botUserId;
      slackConfig.verificationStatus = 'verified';
      slackConfig.verifiedAt = new Date();
    } else {
      // Create new config
      slackConfig = new SlackConfig({
        organization: req.user.organization, // User's organization ObjectId
        organizationId: userOrgId, // String version for easier querying
        clientId,
        clientSecret,
        accessToken,
        status: 'active',
        teamId,
        teamName,
        botUserId,
        verificationStatus: 'verified',
        verifiedAt: new Date()
      });
    }
    
    await slackConfig.save();
    
    // Return sanitized config (without sensitive details)
    const sanitizedConfig = slackConfig.toSanitized ? 
      slackConfig.toSanitized() : 
      {
        teamId,
        teamName,
        status: 'active',
        isConfigured: true
      };
    
    return sendSuccess(res, 'Slack integration configured successfully', { integration: sanitizedConfig });
  } catch (error) {
    console.error('Error configuring Slack integration:', error);
    return sendError(res, 500, `Error configuring Slack integration: ${error.message}`);
  }
});

export default {
  configureSlackIntegration
}; 