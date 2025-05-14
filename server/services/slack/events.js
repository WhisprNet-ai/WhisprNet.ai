/**
 * Slack Events Service
 * Handles Slack event processing, event adapters, and event listeners
 */

import { createEventAdapter } from '@slack/events-api';
import SlackConfig from '../../models/SlackConfig.js';
import { v4 as uuidv4 } from 'uuid';
import { logSlackAction } from './utils.js';

// Organization-specific Slack event adapters
const slackEventAdapters = new Map();

// Export the adapters for use in the server.js file
export { slackEventAdapters };

/**
 * Get or create default Slack events adapter
 * @returns {Object} - Default Slack events adapter
 */
export const getDefaultSlackEventsAdapter = () => {
  try {
    return createEventAdapter(process.env.SLACK_SIGNING_SECRET);
  } catch (error) {
    logSlackAction('events', 'Error creating default Slack events adapter', { 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Get Slack Events adapter for an organization
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Object>} - Slack events adapter
 */
export const getSlackEventsAdapter = async (organizationId) => {
  // Check if we already have an adapter for this organization
  if (slackEventAdapters.has(organizationId)) {
    return slackEventAdapters.get(organizationId);
  }
  
  try {
    // Get organization-specific Slack config
    const slackConfig = await SlackConfig.findOne({ organization: organizationId });
    
    // If no config exists, use default adapter
    if (!slackConfig || !slackConfig.signingSecret) {
      logSlackAction('events', 'No Slack configuration found, using default adapter', { 
        organizationId 
      });
      
      const defaultAdapter = getDefaultSlackEventsAdapter();
      slackEventAdapters.set(organizationId, defaultAdapter);
      return defaultAdapter;
    }
    
    logSlackAction('events', 'Creating new Slack events adapter', { 
      organizationId,
      signingSecretPrefix: slackConfig.signingSecret.substring(0, 3) + '...'
    });
    
    // Create a new adapter with the org-specific signing secret
    const adapter = createEventAdapter(slackConfig.signingSecret, {
      // Add option to verify request signature
      verify: (req) => {
        // Skip signature verification if the special test header is present
        if (req.headers && req.headers['x-whisprnet-test'] === 'true') {
          logSlackAction('events', 'Bypassing signature verification for test request', { 
            organizationId 
          });
          return true;
        }
        // Otherwise use default verification
        return undefined; // Undefined means use default verification
      }
    });
    
    // Add debug event listeners to this adapter
    setupEventListeners(adapter, organizationId);
    
    // Store it for future use
    slackEventAdapters.set(organizationId, adapter);
    
    return adapter;
  } catch (error) {
    logSlackAction('events', 'Error getting Slack events adapter', { 
      error: error.message
    });
    
    // Fallback to default adapter
    const defaultAdapter = getDefaultSlackEventsAdapter();
    return defaultAdapter;
  }
};

/**
 * Process and forward an event to the appropriate handler
 * @param {Object} event - The Slack event object
 * @param {String} organizationId - The organization ID
 */
export const processSlackEvent = async (event, organizationId) => {
  try {
    logSlackAction('events', 'Processing Slack event', { 
      organizationId,
      eventType: event.type,
      channelId: event.channel,
      ts: event.ts || event.event_ts
    });
    
    // Dynamically import to avoid circular dependencies
    const { processAndStoreMetadata } = await import('./insights.js');
    
    // Process metadata
    await processAndStoreMetadata(event, organizationId);
  } catch (error) {
    logSlackAction('events', 'Error processing Slack event', { 
      error: error.message 
    });
  }
};

/**
 * Set up event listeners for a Slack events adapter
 * @param {Object} adapter - Slack events adapter
 * @param {String} organizationId - Organization ID
 */
export const setupEventListeners = (adapter, organizationId) => {
  // Message events
  adapter.on('message', (event) => {
    logSlackAction('events', 'Message event received', { 
      organizationId,
      channelId: event.channel,
      userId: event.user,
      ts: event.ts
    });
    
    processSlackEvent(event, organizationId);
  });
  
  // Direct message events
  adapter.on('message.im', (event) => {
    logSlackAction('events', 'Direct message event received', { 
      organizationId,
      userId: event.user,
      ts: event.ts
    });
    
    processSlackEvent(event, organizationId);
  });
  
  // Reaction events
  adapter.on('reaction_added', (event) => {
    logSlackAction('events', 'Reaction added event received', { 
      organizationId,
      reaction: event.reaction,
      userId: event.user
    });
    
    processSlackEvent(event, organizationId);
  });
  
  adapter.on('reaction_removed', (event) => {
    logSlackAction('events', 'Reaction removed event received', { 
      organizationId,
      reaction: event.reaction,
      userId: event.user
    });
  });
  
  // Channel events
  adapter.on('channel_created', (event) => {
    logSlackAction('events', 'Channel created event received', { 
      organizationId,
      channelId: event.channel.id,
      channelName: event.channel.name
    });
  });
  
  adapter.on('channel_rename', (event) => {
    logSlackAction('events', 'Channel renamed event received', { 
      organizationId,
      channelId: event.channel.id,
      newName: event.channel.name
    });
  });
  
  // Emoji events
  adapter.on('emoji_changed', (event) => {
    logSlackAction('events', 'Emoji changed event received', { 
      organizationId,
      subtype: event.subtype
    });
  });
  
  // App mention events
  adapter.on('app_mention', (event) => {
    logSlackAction('events', 'App mention event received', { 
      organizationId,
      userId: event.user,
      channelId: event.channel
    });
  });
  
  // Generic event listener for any event type
  adapter.on('*', (event) => {
    // Only log types we don't have specific handlers for
    if (!['message', 'reaction_added', 'reaction_removed', 
          'channel_created', 'channel_rename', 'emoji_changed', 
          'app_mention'].includes(event.type)) {
      
      logSlackAction('events', 'Generic event received', { 
        organizationId,
        type: event.type,
        subtype: event.subtype,
        ts: event.event_ts || event.ts
      });
    }
  });
  
  // Error events
  adapter.on('error', (error) => {
    logSlackAction('events', 'Event error', { 
      organizationId,
      error: error.message,
      code: error.code
    });
    
    if (error.code === 'SLACKADAPTER_REQUEST_SIGNATURE_VERIFICATION_FAILURE') {
      logSlackAction('events', 'Signature verification failed - check your signing secret');
    }
  });
};

/**
 * Setup Slack event listeners for all organizations
 * @returns {Object} - Default events adapter
 */
export const setupSlackEventListeners = async () => {
  const defaultAdapter = getDefaultSlackEventsAdapter();
  
  try {
    // Find all organizations with Slack configured
    const slackConfigs = await SlackConfig.find({ 
      status: 'active',
      signingSecret: { $exists: true }
    });
    
    logSlackAction('events', 'Setting up Slack event listeners', { 
      configCount: slackConfigs.length 
    });
    
    // Set up event listeners for each organization
    for (const config of slackConfigs) {
      const organizationId = config.organization.toString();
      await getSlackEventsAdapter(organizationId);
      
      logSlackAction('events', 'Event adapter created for organization', { 
        organizationId 
      });
    }
    
    return defaultAdapter;
  } catch (error) {
    logSlackAction('events', 'Error setting up Slack event listeners', { 
      error: error.message 
    });
    
    return defaultAdapter;
  }
};

/**
 * Process a URL verification challenge from Slack
 * @param {Object} challenge - Challenge data from Slack
 * @returns {Object} - Response with challenge token
 */
export const processUrlVerification = (challenge) => {
  logSlackAction('events', 'Processing URL verification challenge');
  return { challenge: challenge };
}; 