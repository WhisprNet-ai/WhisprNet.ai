/**
 * Slack Services Index
 * Exports all Slack-related functionality from the modular services
 */

// Re-export functionality from individual modules
export * from './auth.js';
export * from './events.js';
export * from './insights.js';
export * from './delivery.js';
export * from './utils.js';

// Export uuid for backward compatibility
import { v4 as uuidv4 } from 'uuid';
export { uuidv4 };

// Export service version info
export const SLACK_SERVICE_VERSION = '2.0.0';
export const SLACK_SERVICE_MODULES = [
  'auth',
  'events',
  'insights',
  'delivery',
  'utils'
];

/**
 * Get version information about the Slack service
 * @returns {Object} - Version information
 */
export const getSlackServiceInfo = () => {
  return {
    version: SLACK_SERVICE_VERSION,
    modules: SLACK_SERVICE_MODULES,
    description: 'Modular Slack integration service for WhisprNet'
  };
}; 