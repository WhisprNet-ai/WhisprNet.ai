/**
 * Slack Authentication Service
 * Handles Slack authentication, OAuth flows, and token management
 */

import { WebClient } from '@slack/web-api';
import SlackConfig from '../../models/SlackConfig.js';
import { v4 as uuidv4 } from 'uuid';
import { logSlackAction } from './utils.js';

/**
 * Create a new Slack configuration for an organization
 * @param {String} organizationId - The organization ID
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Result with new or existing config
 */
export const createSlackConfig = async (organizationId, options = {}) => {
  try {
    logSlackAction('auth', 'Creating new Slack configuration', { organizationId });
    
    // Check if an organization already has a SlackConfig
    const existingConfig = await SlackConfig.findOne({ organization: organizationId });
    
    if (existingConfig) {
      logSlackAction('auth', 'SlackConfig already exists, returning existing config', { 
        configId: existingConfig._id 
      });
      
      return {
        success: true,
        new: false,
        slackConfig: existingConfig,
        configId: existingConfig._id
      };
    }
    
    // Get default values from environment variables
    const defaultConfig = {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      redirectUri: `${process.env.API_URL}/api/integrations/slack/callback`,
      scopes: [
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
    };
    
    // Create new SlackConfig with provided options + defaults
    const slackConfig = new SlackConfig({
      organization: organizationId,
      name: options.name || 'Slack Integration',
      description: options.description || 'Workspace communication insights via Slack',
      status: 'pending',
      clientId: options.clientId || defaultConfig.clientId,
      clientSecret: options.clientSecret || defaultConfig.clientSecret,
      signingSecret: options.signingSecret || defaultConfig.signingSecret,
      redirectUri: options.redirectUri || defaultConfig.redirectUri,
      scopes: options.scopes || defaultConfig.scopes,
      stateSecret: uuidv4(), // Generate unique state for OAuth verification
      appName: options.appName || 'WhisprNet.ai',
      appDescription: options.appDescription || 'WhisprNet.ai Slack Metadata Insights',
      defaultDeliveryChannel: options.defaultDeliveryChannel || 'general'
    });
    
    // Save the new configuration
    await slackConfig.save();
    
    logSlackAction('auth', 'Created new SlackConfig', { 
      configId: slackConfig._id 
    });
    
    return {
      success: true,
      new: true,
      slackConfig,
      configId: slackConfig._id
    };
  } catch (error) {
    logSlackAction('auth', 'Error creating Slack configuration', { error: error.message });
    throw error;
  }
};

/**
 * Generate OAuth URL for Slack
 * @param {String} organizationId - The organization ID
 * @param {String} stateParam - Optional state param for verification
 * @returns {Promise<Object>} - OAuth URL and state
 */
export const getSlackOAuthUrl = async (organizationId, stateParam = null) => {
  try {
    // Get or create Slack config for this organization
    let slackConfig;
    
    // Check if config already exists
    const existingConfig = await SlackConfig.findOne({ organization: organizationId });
    
    if (existingConfig) {
      slackConfig = existingConfig;
      logSlackAction('auth', 'Using existing SlackConfig for OAuth URL generation');
    } else {
      // Create new config
      const result = await createSlackConfig(organizationId);
      slackConfig = result.slackConfig;
      logSlackAction('auth', 'Created new SlackConfig for OAuth URL generation');
    }
    
    // Generate a state parameter if not provided
    const state = stateParam || slackConfig.stateSecret || uuidv4();
    
    // If we don't have a stateSecret stored, save it now
    if (!slackConfig.stateSecret) {
      slackConfig.stateSecret = state;
      await slackConfig.save();
    }
    
    // Build scopes string
    const scopes = Array.isArray(slackConfig.scopes) ? slackConfig.scopes.join(' ') : 'channels:history channels:read chat:write';
    
    // Build redirect URI
    const redirectUri = slackConfig.redirectUri || `${process.env.API_URL}/api/integrations/slack/callback`;
    
    // Generate OAuth URL
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
    
    logSlackAction('auth', 'Generated Slack OAuth URL', { 
      state: state.substring(0, 8) + '...'
    });
    
    return {
      success: true,
      oauthUrl,
      state,
      configId: slackConfig._id
    };
  } catch (error) {
    logSlackAction('auth', 'Error generating Slack OAuth URL', { error: error.message });
    return {
      success: false,
      error: error.message || 'Error generating Slack OAuth URL'
    };
  }
};

/**
 * Process OAuth callback and save tokens
 * @param {String} code - Authorization code
 * @param {String} state - State parameter for verification
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Object>} - Result of token exchange
 */
export const saveSlackOAuthTokens = async (code, state, organizationId) => {
  try {
    logSlackAction('auth', 'Processing OAuth callback', { 
      organizationId,
      state: state.substring(0, 8) + '...'
    });
    
    // Find SlackConfig by organization ID and verify state
    const slackConfig = await SlackConfig.findOne({ 
      organization: organizationId,
      stateSecret: state
    });
    
    if (!slackConfig) {
      logSlackAction('auth', 'Invalid state or SlackConfig not found', { organizationId });
      return {
        success: false,
        error: 'Invalid state parameter or configuration not found'
      };
    }
    
    logSlackAction('auth', 'State verified for SlackConfig', { configId: slackConfig._id });
    
    // Create a web client without initial token
    const client = new WebClient();
    
    // Exchange the code for tokens using configuration credentials
    const response = await client.oauth.v2.access({
      client_id: slackConfig.clientId,
      client_secret: slackConfig.clientSecret,
      code,
      redirect_uri: slackConfig.redirectUri || `${process.env.API_URL}/api/integrations/slack/callback`
    });
    
    if (!response.ok) {
      logSlackAction('auth', 'Failed to exchange code for tokens', { error: response.error });
      return {
        success: false,
        error: response.error || 'Failed to exchange code for tokens'
      };
    }
    
    logSlackAction('auth', 'Successfully exchanged code for tokens', { 
      team: response.team.name 
    });
    
    // Update SlackConfig with tokens and team info
    slackConfig.status = 'active';
    slackConfig.accessToken = response.access_token;
    slackConfig.refreshToken = response.refresh_token || null;
    slackConfig.teamId = response.team.id;
    slackConfig.teamName = response.team.name;
    slackConfig.teamDomain = response.team.domain;
    slackConfig.botToken = response.access_token;
    slackConfig.botUserId = response.bot_user_id;
    slackConfig.lastSyncedAt = new Date();
    
    // Save the updated config
    await slackConfig.save();
    
    logSlackAction('auth', 'Saved Slack tokens to SlackConfig', { 
      teamName: response.team.name
    });
    
    // Optionally clear the state secret for security
    slackConfig.stateSecret = null;
    await slackConfig.save();
    
    return {
      success: true,
      slackConfig: slackConfig.toSanitized ? slackConfig.toSanitized() : {
        _id: slackConfig._id,
        organization: slackConfig.organization,
        teamName: slackConfig.teamName,
        teamDomain: slackConfig.teamDomain,
        status: slackConfig.status
      },
      teamInfo: {
        id: response.team.id,
        name: response.team.name,
        domain: response.team.domain
      }
    };
  } catch (error) {
    logSlackAction('auth', 'Error processing OAuth callback', { error: error.message });
    return {
      success: false,
      error: error.message || 'Error processing OAuth callback'
    };
  }
};

/**
 * Verify Slack authentication and token validity
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Object>} - Verification result
 */
export const verifySlackAuthentication = async (organizationId) => {
  try {
    // Find active Slack config
    const slackConfig = await SlackConfig.findOne({
      organization: organizationId,
      status: 'active'
    });
    
    if (!slackConfig || !slackConfig.botToken) {
      return {
        success: false,
        verified: false,
        error: 'No active Slack configuration found'
      };
    }
    
    // Create Slack client
    const client = new WebClient(slackConfig.botToken);
    
    // Test auth
    const authTest = await client.auth.test();
    
    if (!authTest.ok) {
      // Update config status if token is invalid
      if (authTest.error === 'invalid_auth' || authTest.error === 'token_revoked') {
        slackConfig.status = 'revoked';
        await slackConfig.save();
      }
      
      return {
        success: false,
        verified: false,
        error: authTest.error
      };
    }
    
    // Update team info if needed
    if (authTest.team_id !== slackConfig.teamId || 
        authTest.user_id !== slackConfig.botUserId) {
      slackConfig.teamId = authTest.team_id;
      slackConfig.teamName = authTest.team;
      slackConfig.botUserId = authTest.user_id;
      await slackConfig.save();
    }
    
    return {
      success: true,
      verified: true,
      teamInfo: {
        id: authTest.team_id,
        name: authTest.team,
        botId: authTest.bot_id,
        userId: authTest.user_id
      }
    };
  } catch (error) {
    logSlackAction('auth', 'Error verifying Slack authentication', { 
      error: error.message
    });
    
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
}; 