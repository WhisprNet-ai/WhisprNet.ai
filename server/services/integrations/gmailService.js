import axios from 'axios';
import Integration from '../../models/Integration.js';

/**
 * Create a new Gmail integration
 * @param {string} organizationId - Organization ID
 * @param {string} name - Integration name
 * @returns {Promise<Object>} - Integration object
 */
export const createGmailIntegration = async (organizationId, name) => {
  try {
    const integration = await Integration.create({
      organizationId,
      type: 'email',
      name: name || 'Gmail Integration',
      metadata: {
        provider: 'gmail'
      },
      status: 'pending'
    });
    
    return integration;
  } catch (error) {
    console.error('Error creating Gmail integration:', error);
    throw new Error('Failed to create Gmail integration');
  }
};

/**
 * Save Gmail authentication tokens
 * @param {string} code - OAuth code
 * @param {Object} integration - Integration document
 * @returns {Promise<Object>} - Success status and updated integration
 */
export const saveGmailTokens = async (code, integration) => {
  try {
    // Exchange authorization code for tokens
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );
    
    const { access_token, refresh_token, expires_in, token_type } = response.data;
    
    if (!access_token) {
      return {
        success: false,
        error: 'Failed to obtain Gmail access token'
      };
    }
    
    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const { emailAddress, messagesTotal, threadsTotal } = userResponse.data;
    
    // Calculate token expiry time
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
    
    // Update integration with token and user info
    integration.credentials = {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenType: token_type,
      tokenExpiry,
      emailAddress
    };
    
    integration.status = 'active';
    integration.lastSyncedAt = new Date();
    integration.metadata = {
      ...integration.metadata,
      messagesTotal,
      threadsTotal
    };
    
    await integration.save();
    
    return {
      success: true,
      integration
    };
  } catch (error) {
    console.error('Error saving Gmail tokens:', error);
    return {
      success: false,
      error: `Failed to save Gmail tokens: ${error.message}`
    };
  }
};

/**
 * Refresh Gmail access token if expired
 * @param {Object} integration - Integration document
 * @returns {Promise<Object>} - Updated integration with fresh token
 */
export const refreshGmailToken = async (integration) => {
  try {
    if (!integration.credentials?.refreshToken) {
      throw new Error('Gmail integration missing refresh token');
    }
    
    // Check if token is still valid
    const tokenExpiry = new Date(integration.credentials.tokenExpiry);
    const now = new Date();
    
    // If token is still valid, return the integration
    if (tokenExpiry > now) {
      return integration;
    }
    
    // Otherwise, refresh the token
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        refresh_token: integration.credentials.refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    );
    
    const { access_token, expires_in } = response.data;
    
    if (!access_token) {
      throw new Error('Failed to refresh Gmail access token');
    }
    
    // Calculate new token expiry time
    const newTokenExpiry = new Date();
    newTokenExpiry.setSeconds(newTokenExpiry.getSeconds() + expires_in);
    
    // Update integration with new token
    integration.credentials.accessToken = access_token;
    integration.credentials.tokenExpiry = newTokenExpiry;
    await integration.save();
    
    return integration;
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    integration.status = 'error';
    await integration.save();
    throw new Error(`Failed to refresh Gmail token: ${error.message}`);
  }
};

/**
 * Fetch Gmail labels
 * @param {Object} integration - Integration document
 * @returns {Promise<Array>} - List of Gmail labels
 */
export const fetchGmailLabels = async (integration) => {
  try {
    // Refresh token if needed
    integration = await refreshGmailToken(integration);
    
    const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/labels', {
      headers: {
        Authorization: `Bearer ${integration.credentials.accessToken}`
      }
    });
    
    return response.data.labels;
  } catch (error) {
    console.error('Error fetching Gmail labels:', error);
    throw new Error(`Failed to fetch Gmail labels: ${error.message}`);
  }
};

/**
 * Synchronize email data from Gmail
 * @param {Object} integration - Integration document
 * @param {Object} options - Sync options (labels, maxResults, etc.)
 * @returns {Promise<Object>} - Sync results
 */
export const syncGmailData = async (integration, options = {}) => {
  try {
    // Refresh token if needed
    integration = await refreshGmailToken(integration);
    
    // Default options
    const syncOptions = {
      maxResults: options.maxResults || 100,
      labelIds: options.labelIds || ['INBOX'],
      startHistoryId: options.startHistoryId
    };
    
    // Get messages
    const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/messages', {
      headers: {
        Authorization: `Bearer ${integration.credentials.accessToken}`
      },
      params: {
        maxResults: syncOptions.maxResults,
        labelIds: syncOptions.labelIds.join(','),
        q: options.query || ''
      }
    });
    
    // Update last synced timestamp
    integration.lastSyncedAt = new Date();
    await integration.save();
    
    return {
      success: true,
      syncedAt: integration.lastSyncedAt,
      messageCount: response.data.messages ? response.data.messages.length : 0,
      nextPageToken: response.data.nextPageToken
    };
  } catch (error) {
    console.error('Error syncing Gmail data:', error);
    return {
      success: false,
      error: `Failed to sync Gmail data: ${error.message}`
    };
  }
}; 