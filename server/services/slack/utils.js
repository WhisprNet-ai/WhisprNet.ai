/**
 * Slack Service Utilities
 * Contains shared utility functions used across Slack services
 */

import { WebClient } from '@slack/web-api';
import SlackConfig from '../../models/SlackConfig.js';

// Redis key patterns
export const getRedisCountKey = (organizationId) => `slack:org:${organizationId}:count`;
export const getRedisDelayedKey = (organizationId) => `slack:org:${organizationId}:delayed`;

/**
 * Get a Slack client for a specific organization
 * @param {String} organizationId - The organization ID
 * @returns {Promise<WebClient>} - Slack client
 * @throws {Error} - If no active Slack configuration found
 */
export const getSlackClient = async (organizationId) => {
  try {
    // Find active Slack configuration for this organization
    const slackConfig = await SlackConfig.findOne({
      organization: organizationId,
      status: 'active'
    });
    
    if (!slackConfig || !slackConfig.botToken) {
      throw new Error('No active Slack configuration found for this organization');
    }
    
    // Create a new web client with the organization's token
    return new WebClient(slackConfig.botToken);
  } catch (error) {
    console.error('Error getting Slack client:', error);
    throw error;
  }
};

/**
 * Format message blocks for Slack
 * @param {Object} data - Message data
 * @param {String} data.title - Message title
 * @param {String} data.message - Message body
 * @param {Array} [data.suggestedActions] - Suggested actions
 * @param {Number} [data.confidence] - Confidence level (0-1)
 * @returns {Array} - Formatted Slack blocks
 */
export const formatSlackBlocks = (data) => {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🤫 ${data.title}`,
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: data.message
      }
    }
  ];
  
  // Add suggested actions if any
  if (data.suggestedActions && data.suggestedActions.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Suggested Actions:*'
      }
    });
    
    const actionItems = data.suggestedActions.map(action => `• ${action}`).join('\n');
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: actionItems
      }
    });
  }
  
  // Add data context information if confidence provided
  if (data.confidence !== undefined) {
    const confidence = data.confidence || 0.75;
    const confidenceText = confidence >= 0.8 ? 'High' : (confidence >= 0.6 ? 'Medium' : 'Low');
    const timeframe = data.timeframe || '7 days';
    
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Data context:* Based on patterns from the last ${timeframe} with ${confidenceText} confidence`
        }
      ]
    });
  }
  
  return blocks;
};

/**
 * Log an action with consistent formatting
 * @param {String} component - Component name
 * @param {String} action - Action being performed
 * @param {Object} data - Data to log
 */
export const logSlackAction = (component, action, data = {}) => {
  const stringifiedData = Object.keys(data).length > 0 
    ? JSON.stringify(data, null, 2)
    : '';
  
  console.log(`[SLACK:${component}] ${action}${stringifiedData ? '\n' + stringifiedData : ''}`);
};

/**
 * Find a workspace admin user
 * @param {WebClient} slackClient - Slack client
 * @returns {Promise<Object>} - Admin user info
 * @throws {Error} - If no admin found
 */
export const findWorkspaceAdmin = async (slackClient) => {
  try {
    const response = await slackClient.users.list();
    
    if (!response.ok) {
      throw new Error(`Failed to get Slack users list: ${response.error}`);
    }
    
    // Look for an admin user
    const admin = response.members.find(member => 
      member.is_admin || member.is_owner || member.is_primary_owner
    );
    
    if (!admin) {
      throw new Error('No admin user found in Slack workspace');
    }
    
    return admin;
  } catch (error) {
    console.error('Error finding workspace admin:', error);
    throw error;
  }
}; 