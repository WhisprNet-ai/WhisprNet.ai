/**
 * Legacy Slack Metadata Service
 * @deprecated Use the modular service from '../slack/index.js' instead
 * 
 * This file is maintained for backward compatibility during migration
 * to the modular Slack service architecture.
 */

import { getLegacySlackServiceProxy, logDeprecation } from '../slack/migration.js';
import * as slackModule from '../slack/index.js';

// Add deprecation warnings
console.warn('[DEPRECATED] slackMetadataService.js is deprecated. Use modular services from slack/ directory instead.');

// Re-export the functionality from the new modular structure
export * from '../slack/index.js';

// Create deprecated function versions with logging
export const processSlackEventMetadata = (...args) => {
  logDeprecation('processSlackEventMetadata', 'processSlackEventMetadata', 'slack/insights.js');
  return slackModule.processSlackEventMetadata(...args);
};

export const storeMetadataForOrganization = (...args) => {
  logDeprecation('storeMetadataForOrganization', 'storeMetadataForOrganization', 'slack/insights.js');
  return slackModule.storeMetadataForOrganization(...args);
};

export const scheduleMetadataAnalysis = (...args) => {
  logDeprecation('scheduleMetadataAnalysis', 'scheduleMetadataAnalysis', 'slack/insights.js');
  return slackModule.scheduleMetadataAnalysis(...args);
};

export const triggerMetadataAnalysis = (...args) => {
  logDeprecation('triggerMetadataAnalysis', 'triggerMetadataAnalysis', 'slack/insights.js');
  return slackModule.triggerMetadataAnalysis(...args);
};

export const analyzeChannelParticipation = (...args) => {
  logDeprecation('analyzeChannelParticipation', 'analyzeChannelParticipation', 'slack/insights.js');
  return slackModule.analyzeChannelParticipation(...args);
};

export const analyzeEmojiTrends = (...args) => {
  logDeprecation('analyzeEmojiTrends', 'analyzeEmojiTrends', 'slack/insights.js');
  return slackModule.analyzeEmojiTrends(...args);
};

export const deliverSlackInsight = (...args) => {
  logDeprecation('deliverSlackInsight', 'deliverSlackInsight', 'slack/delivery.js');
  return slackModule.deliverSlackInsight(...args);
};

export const getRecentWhispers = (...args) => {
  logDeprecation('getRecentWhispers', 'getRecentWhispers', 'slack/delivery.js');
  return slackModule.getRecentWhispers(...args);
};

// Fix existing circular dependencies by adding missing function
export const analyzeSlackMetadata = async (organizationId, metadataCollection) => {
  logDeprecation('analyzeSlackMetadata', 'analyzeSlackMetadata', 'slack/insights.js');
  
  try {
    const { runDynamicAgentWorkflow } = await import('../agents/dynamicAgentWorkflow.js');
    
    // Run participation analysis
    const participationAnalysis = slackModule.analyzeChannelParticipation(metadataCollection);
    
    // Run emoji trend analysis
    const emojiTrends = slackModule.analyzeEmojiTrends(metadataCollection);
    
    // Add participation insights to metadata for agent processing
    const enhancedMetadata = [...metadataCollection];
    
    // Add analyses to the enhanced metadata
    if (participationAnalysis.length > 0) {
      enhancedMetadata.push({
        eventId: slackModule.uuidv4(),
        source: 'slack_analyzer',
        eventType: 'participation_analysis',
        metadata_type: 'channel_activity',
        timestamp: new Date(),
        channelParticipation: participationAnalysis,
        organizationId
      });
    }
    
    enhancedMetadata.push({
      eventId: slackModule.uuidv4(),
      source: 'slack_analyzer',
      eventType: 'emoji_trend_analysis',
      metadata_type: 'emoji_usage',
      timestamp: new Date(),
      emojiTrends,
      organizationId
    });
    
    // Run the dynamic agent workflow with the enhanced metadata
    return await runDynamicAgentWorkflow(organizationId, enhancedMetadata);
  } catch (error) {
    console.error('[TRACE] Error analyzing Slack metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get a proxy that handles all legacy function calls for backward compatibility
const legacyProxy = getLegacySlackServiceProxy();
export default legacyProxy; 