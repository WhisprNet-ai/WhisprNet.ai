import SlackConfig from '../../models/SlackConfig.js';
import { asyncHandler } from '../../middleware/async.js';
import ErrorResponse from '../../utils/errorResponse.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { checkUserOrgAccess } from '../../utils/userAccess.js';

// Helper function to mask sensitive data
const maskSensitiveData = (value) => {
  if (!value) return '';
  if (value.length <= 6) return 'XXXXXX'; // If too short, just mask completely
  return `${value.substring(0, 3)}XXXXXXXXXXXXXXXX${value.substring(value.length - 3)}`;
};

// Update the toSanitized method in the model (or add it here if it's not in the model)
const getSanitizedConfig = (slackConfig) => {
  const obj = slackConfig.toObject ? slackConfig.toObject() : slackConfig;
  
  // Create masked versions
  const clientSecretMasked = maskSensitiveData(obj.clientSecret);
  const signingSecretMasked = maskSensitiveData(obj.signingSecret);
  const botTokenMasked = maskSensitiveData(obj.botToken);
  
  // Remove sensitive fields
  delete obj.clientSecret;
  delete obj.signingSecret;
  delete obj.stateSecret;
  delete obj.botToken;
  
  // Return with masked fields
  return {
    ...obj,
    clientIdMasked: obj.clientId ? `${obj.clientId.substring(0, 3)}...${obj.clientId.substring(obj.clientId.length - 3)}` : null,
    clientSecretMasked,
    signingSecretMasked,
    botTokenMasked,
    isConfigured: !!(obj.clientId && (obj.clientSecret || obj.botToken))
  };
};

/**
 * @desc    Get Slack configuration for an organization
 * @route   GET /api/organizations/:organizationId/slack-config
 * @access  Private
 */
export const getSlackConfig = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Verify the user has access to this organization
    const userHasAccess = await checkUserOrgAccess(req.user.id, organizationId);
    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: "You don't have access to this organization" });
    }

    // Find any existing Slack config for this organization
    const slackConfig = await SlackConfig.findOne({ organization: organizationId });

    if (!slackConfig) {
      return res.status(404).json({ success: false, message: "No Slack configuration found for this organization" });
    }

    // Return the config with unmasked sensitive data
    return res.status(200).json({
      success: true,
      data: {
        clientId: slackConfig.clientId,
        // Return unmasked sensitive data (full credentials)
        clientSecret: slackConfig.clientSecret,
        signingSecret: slackConfig.signingSecret,
        botToken: slackConfig.botToken,
        // Other non-sensitive fields
        appName: slackConfig.appName,
        scopes: slackConfig.scopes,
        verificationStatus: slackConfig.verificationStatus || 'pending'
      }
    });
  } catch (error) {
    console.error('Error fetching Slack config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create or update Slack configuration for an organization
 * @route   POST/PUT /api/organizations/:organizationId/slack-config
 * @access  Private
 */
export const createUpdateSlackConfig = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { clientId, clientSecret, signingSecret, botToken, appName, scopes } = req.body;

    // Verify the user has access to this organization
    const userHasAccess = await checkUserOrgAccess(req.user.id, organizationId);
    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: "You don't have access to this organization" });
    }

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client ID is required" });
    }

    // Find existing config or create new one
    let slackConfig = await SlackConfig.findOne({ organization: organizationId });
    
    if (slackConfig) {
      // Only update fields that are provided
      const updateData = {
        clientId,
        appName: appName || slackConfig.appName
      };
      
      // Only update scopes if provided
      if (scopes) {
        updateData.scopes = scopes;
      }
      
      // Only update sensitive data if provided (not empty)
      if (clientSecret) {
        updateData.clientSecret = clientSecret;
      }
      
      if (signingSecret) {
        updateData.signingSecret = signingSecret;
      }
      
      if (botToken) {
        updateData.botToken = botToken;
      }
      
      slackConfig = await SlackConfig.findOneAndUpdate(
        { organization: organizationId },
        updateData,
        { new: true }
      );
    } else {
      // Create new config
      slackConfig = await SlackConfig.create({
        organization: organizationId,
        clientId,
        clientSecret: clientSecret || '',
        signingSecret: signingSecret || '',
        botToken: botToken || '',
        appName: appName || 'WhisprNet.ai',
        scopes: scopes || [
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
        ],
        verificationStatus: 'pending'
      });
    }

    // Return success with unmasked sensitive data
    return res.status(200).json({
      success: true,
      data: {
        clientId: slackConfig.clientId,
        // Return unmasked sensitive data (full credentials)
        clientSecret: slackConfig.clientSecret,
        signingSecret: slackConfig.signingSecret,
        botToken: slackConfig.botToken,
        // Other non-sensitive fields
        appName: slackConfig.appName,
        scopes: slackConfig.scopes,
        verificationStatus: slackConfig.verificationStatus || 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating/updating Slack config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify Slack credentials
 * @route   POST /api/organizations/:organizationId/slack-config/verify-credentials
 * @access  Private
 */
export const verifySlackCredentials = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { clientId, clientSecret, signingSecret, botToken } = req.body;

    // Verify the user has access to this organization
    const userHasAccess = await checkUserOrgAccess(req.user.id, organizationId);
    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: "You don't have access to this organization" });
    }

    // Find existing config for this organization
    const slackConfig = await SlackConfig.findOne({ organization: organizationId });
    
    if (!slackConfig) {
      return res.status(404).json({ 
        success: false, 
        message: "No Slack configuration found for this organization. Please save configuration first." 
      });
    }

    // Use provided credentials or fall back to stored ones
    const credentialsToVerify = {
      clientId: clientId || slackConfig.clientId,
      clientSecret: clientSecret || slackConfig.clientSecret,
      signingSecret: signingSecret || slackConfig.signingSecret,
      botToken: botToken || slackConfig.botToken
    };

    // Do the verification against Slack API
    let isValid = false;
    try {
      // Example: Validate with Slack API
      // Replace with actual verification logic
      const response = await axios.get('https://slack.com/api/auth.test', {
        headers: {
          Authorization: `Bearer ${credentialsToVerify.botToken}`
        }
      });
      console.log(response.data);
      
      isValid = response.data && response.data.ok === true;
    } catch (error) {
      console.error('Slack API verification error:', error);
      isValid = false;
    }

    // Update verification status in the database
    await SlackConfig.findOneAndUpdate(
      { organization: organizationId },
      { 
        verificationStatus: isValid ? 'verified' : 'failed',
        status: isValid ? 'active' : 'pending',
        ...(isValid && { verifiedAt: new Date() })
      },
      { new: true }
    );

    return res.status(200).json({
      success: isValid,
      message: isValid ? 'Credentials verified successfully' : 'Failed to verify credentials with Slack API'
    });
  } catch (error) {
    console.error('Error verifying Slack credentials:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify Slack app configuration
 * @route   POST /api/organizations/:organizationId/slack-config/verify
 * @access  Private
 */
export const verifySlackConfig = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;

  // Find existing Slack configuration
  const slackConfig = await SlackConfig.findOne({ organization: organizationId });

  if (!slackConfig) {
    return next(
      new ErrorResponse('Slack app configuration not found', 404)
    );
  }

  // Verify the configuration by making a test API call
  try {
    // Import Slack client
    const { WebClient } = await import('@slack/web-api');
    
    if (slackConfig.botToken) {
      // Use bot token for verification if available (preferred method)
      const slack = new WebClient(slackConfig.botToken);
      // Test the token
      const authTest = await slack.auth.test();
      
      if (!authTest.ok) {
        throw new Error('Bot token verification failed');
      }
    } else if (slackConfig.clientId && slackConfig.clientSecret) {
      // Fallback to client credentials
      const slack = new WebClient();
      // Test API connection using client credentials
      const authTestResult = await slack.oauth.v2.exchange({
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret
      });
      
      if (!authTestResult.ok) {
        throw new Error('Client credentials verification failed');
      }
    } else {
      throw new Error('No valid credentials found for verification');
    }

    // Update verification status
    slackConfig.verificationStatus = 'verified';
    slackConfig.status = 'active';
    slackConfig.verifiedAt = new Date();
    slackConfig.verificationError = null;
    await slackConfig.save();

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: 'verified',
        message: 'Slack app configuration verified successfully'
      }
    });
  } catch (error) {
    // Update verification status with error
    slackConfig.verificationStatus = 'failed';
    slackConfig.verificationError = error.message || 'Verification failed';
    await slackConfig.save();

    return next(
      new ErrorResponse(`Slack app verification failed: ${error.message}`, 400)
    );
  }
});

/**
 * @desc    Delete Slack app configuration
 * @route   DELETE /api/organizations/:organizationId/slack-config
 * @access  Private
 */
export const deleteSlackConfig = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;

  // Find existing Slack configuration
  const slackConfig = await SlackConfig.findOne({ organization: organizationId });

  if (!slackConfig) {
    return next(
      new ErrorResponse('Slack app configuration not found', 404)
    );
  }

  // Check if the Slack configuration is currently active
  if (slackConfig.status === 'active') {
    return next(
      new ErrorResponse('Cannot delete configuration while Slack integration is active. Deactivate it first.', 400)
    );
  }

  // Delete the configuration
  await slackConfig.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get Events API verification status
 * @route   GET /api/organizations/:organizationId/slack-config/events-api-status
 * @access  Private
 */
export const getEventsApiStatus = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;

  // Find existing Slack configuration
  const slackConfig = await SlackConfig.findOne({ organization: organizationId });

  if (!slackConfig) {
    return next(
      new ErrorResponse('Slack app configuration not found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      eventsApiEnabled: slackConfig.eventsApiEnabled,
      eventsApiRequestUrl: slackConfig.eventsApiRequestUrl,
      verificationStatus: slackConfig.verificationStatus
    }
  });
}); 