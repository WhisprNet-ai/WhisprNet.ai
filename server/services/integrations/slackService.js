/**
 * Legacy Slack Service
 * @deprecated Use the modular service from '../slack/index.js' instead
 * 
 * This file is maintained for backward compatibility during migration
 * to the modular Slack service architecture.
 */

import { getLegacySlackServiceProxy, logDeprecation } from '../slack/migration.js';
import * as slackModule from '../slack/index.js';

// Add deprecation warnings
console.warn('[DEPRECATED] slackService.js is deprecated. Use modular services from slack/ directory instead.');

// Re-export all functionality from the new modular structure
export * from '../slack/index.js';

// Export legacy adapter maps for backward compatibility
export const slackEventAdapters = slackModule.slackEventAdapters;
export const slackEvents = slackModule.getDefaultSlackEventsAdapter();

// Create deprecated function versions with logging
export const getSlackEventsAdapter = (...args) => {
  logDeprecation('getSlackEventsAdapter', 'getSlackEventsAdapter', 'slack/events.js');
  return slackModule.getSlackEventsAdapter(...args);
};

export const setupSlackEventListeners = (...args) => {
  logDeprecation('setupSlackEventListeners', 'setupSlackEventListeners', 'slack/events.js');
  return slackModule.setupSlackEventListeners(...args);
};

export const getSlackClient = (...args) => {
  logDeprecation('getSlackClient', 'getSlackClient', 'slack/utils.js');
  return slackModule.getSlackClient(...args);
};

export const createSlackConfig = (...args) => {
  logDeprecation('createSlackConfig', 'createSlackConfig', 'slack/auth.js');
  return slackModule.createSlackConfig(...args);
};

export const getSlackOAuthUrl = (...args) => {
  logDeprecation('getSlackOAuthUrl', 'getSlackOAuthUrl', 'slack/auth.js');
  return slackModule.getSlackOAuthUrl(...args);
};

export const saveSlackOAuthTokens = (...args) => {
  logDeprecation('saveSlackOAuthTokens', 'saveSlackOAuthTokens', 'slack/auth.js');
  return slackModule.saveSlackOAuthTokens(...args);
};

// Backward compatibility for sendSlackWhisper (redirected to newer function)
export const sendSlackWhisper = (organizationId, whisperData) => {
  logDeprecation('sendSlackWhisper', 'sendSlackChannelMessage', 'slack/delivery.js');
  return slackModule.sendSlackChannelMessage(
    organizationId, 
    whisperData, 
    whisperData.target || 'general'
  );
};

// Deprecated functions that need special handling
export const createSlackIntegration = async (organizationId, name) => {
  logDeprecation('createSlackIntegration', 'createSlackConfig', 'slack/auth.js');
  
  return slackModule.createSlackConfig(organizationId, { name });
};

export const saveSlackTokens = async (code, integration) => {
  logDeprecation('saveSlackTokens', 'saveSlackOAuthTokens', 'slack/auth.js');
  
    // Create a mock state from the integration ID
    const state = integration._id.toString();
    
    // Call the new function
  return slackModule.saveSlackOAuthTokens(code, state, integration.organization);
};

// Get a proxy that handles all legacy function calls for backward compatibility
const legacyProxy = getLegacySlackServiceProxy();
export default legacyProxy; 