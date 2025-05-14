/**
 * Slack Service Migration Helper
 * Provides backward compatibility during the transition to the modular structure
 */

import * as slackServices from './index.js';
import { logSlackAction } from './utils.js';

// Map of old function names to new module paths
const legacyFunctionMap = {
  // Auth functions
  createSlackConfig: 'auth',
  getSlackOAuthUrl: 'auth',
  saveSlackOAuthTokens: 'auth',
  verifySlackAuthentication: 'auth',
  
  // Events functions
  getSlackEventsAdapter: 'events',
  setupSlackEventListeners: 'events',
  processSlackEvent: 'events',
  processUrlVerification: 'events',
  
  // Insights functions
  processSlackEventMetadata: 'insights',
  processAndStoreMetadata: 'insights',
  storeMetadataForOrganization: 'insights',
  scheduleMetadataAnalysis: 'insights',
  triggerMetadataAnalysis: 'insights',
  analyzeChannelParticipation: 'insights',
  analyzeEmojiTrends: 'insights',
  
  // Delivery functions
  deliverSlackInsight: 'delivery',
  sendSlackChannelMessage: 'delivery',
  deliverWhisperWithFallback: 'delivery',
  
  // Utils functions
  getSlackClient: 'utils',
  formatSlackBlocks: 'utils',
  logSlackAction: 'utils',
  findWorkspaceAdmin: 'utils',
  getRedisCountKey: 'utils',
  getRedisDelayedKey: 'utils'
};

/**
 * Proxy handler for backward compatibility
 * Routes legacy function calls to their new modules
 */
const legacyProxyHandler = {
  get: function(target, prop) {
    // Check if the property is a function in our map
    if (legacyFunctionMap[prop]) {
      logSlackAction('migration', `Legacy function call: ${prop}`, { 
        module: legacyFunctionMap[prop] 
      });
      return slackServices[prop];
    }
    
    // Return the property from the target object
    return target[prop];
  }
};

// Create a proxy object to handle legacy function calls
const legacySlackServiceProxy = new Proxy({}, legacyProxyHandler);

/**
 * Get a proxy that handles legacy function calls
 * @returns {Object} - Proxy object
 */
export const getLegacySlackServiceProxy = () => {
  return legacySlackServiceProxy;
};

/**
 * Log deprecated function usage
 * @param {String} oldFunctionName - Old function name
 * @param {String} newFunctionName - New function name
 * @param {String} newModulePath - New module path
 */
export const logDeprecation = (oldFunctionName, newFunctionName, newModulePath) => {
  const message = `Function ${oldFunctionName} is deprecated. ` +
    `Use ${newFunctionName || oldFunctionName} from ${newModulePath} instead.`;
  
  console.warn(`[SLACK:DEPRECATED] ${message}`);
  
  return message;
}; 