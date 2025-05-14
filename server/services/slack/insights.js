/**
 * Slack Insights Service
 * Handles processing and analysis of Slack metadata for generating insights
 */

import { v4 as uuidv4 } from 'uuid';
import SlackMetadata from '../../models/SlackMetadata.js';
import { getRedisClient } from '../redis/redisClient.js';
import { getQueue, QUEUES } from '../queue/bullMQSetup.js';
import { getRedisCountKey, getRedisDelayedKey, logSlackAction } from './utils.js';

// Analysis settings
const METADATA_BATCH_SIZE = 100000; // Number of metadata items to collect before analysis
const ANALYSIS_INTERVAL = 60000; // 1 minute in milliseconds (reduced from 8 hours)

/**
 * Process Slack metadata events and prepare them for agent consumption
 * @param {Object} event - The Slack event object
 * @param {String} organizationId - The organization ID
 * @returns {Object} - Processed metadata
 */
export const processSlackEventMetadata = async (event, organizationId) => {
  try {
    // Only process metadata, not full message content (for privacy)
    let metadata = {};
    
    // Process different event types
    switch (event.type) {
      case 'message':
        metadata = processMessageMetadata(event, organizationId);
        break;
      case 'reaction_added':
        metadata = processReactionMetadata(event, organizationId);
        break;
      case 'member_joined_channel':
      case 'member_left_channel':
        metadata = processChannelPresenceMetadata(event, organizationId);
        break;
      default:
        // For other events, extract basic metadata
        metadata = {
          eventId: uuidv4(),
          source: 'slack',
          eventType: event.type,
          timestamp: new Date(parseInt(event.event_ts || event.ts) * 1000),
          teamId: event.team,
          userId: event.user,
          organizationId
        };
    }
    
    return metadata;
  } catch (error) {
    logSlackAction('insights', 'Error processing Slack metadata', { error: error.message });
    throw error;
  }
};

/**
 * Store and process metadata for an organization
 * @param {Object} event - The Slack event
 * @param {String} organizationId - The organization ID
 */
export const processAndStoreMetadata = async (event, organizationId) => {
  try {
    // Process the metadata
    const metadata = await processSlackEventMetadata(event, organizationId);
    
    // Store the metadata
    await storeMetadataForOrganization(organizationId, metadata);
  } catch (error) {
    logSlackAction('insights', 'Error processing and storing metadata', { 
      error: error.message,
      organizationId
    });
  }
};

/**
 * Store metadata for an organization in MongoDB and update Redis counter
 * @param {String} organizationId - The organization ID
 * @param {Object} metadata - The metadata to store
 */
export const storeMetadataForOrganization = async (organizationId, metadata) => {
  try {
    // Get Redis client
    const redis = getRedisClient();
    
    // Store metadata in MongoDB
    const metadataDoc = new SlackMetadata({
      ...metadata,
      organizationId,
      processingStatus: 'pending'
    });
    
    await metadataDoc.save();
    
    // Increment counter in Redis
    const newCount = await redis.incr(getRedisCountKey(organizationId));
    logSlackAction('insights', 'Metadata stored', { 
      organizationId, 
      newCount
    });
    
    // If we've reached batch size, trigger analysis
    if (newCount >= METADATA_BATCH_SIZE) {
      logSlackAction('insights', 'Batch size reached, triggering analysis', { 
        organizationId, 
        count: newCount
      });
      
      // Clear any existing scheduled analysis
      const delayedExists = await redis.exists(getRedisDelayedKey(organizationId));
      if (delayedExists) {
        // Remove delayed job flag
        await redis.del(getRedisDelayedKey(organizationId));
      }
      
      // Trigger analysis immediately
      await triggerMetadataAnalysis(organizationId, 0);
    } else {
      // If we're under the threshold, schedule analysis if not already scheduled
      await scheduleMetadataAnalysis(organizationId);
    }
  } catch (error) {
    logSlackAction('insights', 'Error storing metadata', { 
      error: error.message,
      organizationId
    });
    throw error;
  }
};

/**
 * Schedule metadata analysis for an organization if not already scheduled
 * @param {String} organizationId - The organization ID
 */
export const scheduleMetadataAnalysis = async (organizationId) => {
  try {
    // Get Redis client
    const redis = getRedisClient();
    
    // Check if analysis is already scheduled
    const delayedExists = await redis.exists(getRedisDelayedKey(organizationId));
    
    if (!delayedExists) {
      logSlackAction('insights', 'Scheduling analysis', { 
        organizationId,
        delaySeconds: ANALYSIS_INTERVAL / 1000
      });
      
      // Set a flag indicating analysis is scheduled
      await redis.set(getRedisDelayedKey(organizationId), '1', 'EX', Math.ceil(ANALYSIS_INTERVAL / 1000) + 60);
      
      // Schedule analysis job with delay
      await triggerMetadataAnalysis(organizationId, ANALYSIS_INTERVAL);
    } else {
      logSlackAction('insights', 'Analysis already scheduled', { organizationId });
    }
  } catch (error) {
    logSlackAction('insights', 'Error scheduling analysis', { 
      error: error.message,
      organizationId
    });
    throw error;
  }
};

/**
 * Trigger metadata analysis job for an organization
 * @param {String} organizationId - The organization ID
 * @param {Number} delay - Delay in milliseconds before processing
 */
export const triggerMetadataAnalysis = async (organizationId, delay = 0) => {
  try {
    // Get the queue for Slack metadata analysis
    const queue = getQueue(QUEUES.SLACK_METADATA_ANALYSIS);
    
    // Use organization ID as job ID for de-duplication
    const jobId = `org-${organizationId}`;
    
    // Add job to queue
    const job = await queue.add('analyze-metadata', 
      { organizationId }, 
      { 
        delay,
        jobId, // Using jobId for replacement - this ensures only one job per org
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    
    logSlackAction('insights', 'Added analysis job', { 
      organizationId,
      jobId: job.id,
      delayMs: delay
    });
    
    return {
      success: true,
      jobId: job.id
    };
  } catch (error) {
    logSlackAction('insights', 'Error triggering analysis', { 
      error: error.message,
      organizationId
    });
    throw error;
  }
};

/**
 * Process message event metadata
 */
const processMessageMetadata = (event, organizationId) => {
  const messageTime = new Date(parseInt(event.ts) * 1000);
  const hour = messageTime.getHours();
  
  return {
    eventId: uuidv4(),
    source: 'slack',
    eventType: 'message',
    subtype: event.subtype || 'regular',
    timestamp: messageTime,
    channelId: event.channel,
    userId: event.user,
    teamId: event.team,
    hasAttachments: event.attachments ? event.attachments.length > 0 : false,
    hasEmoji: event.text ? event.text.includes(':') : false,
    messageLength: event.text ? event.text.length : 0,
    threadTs: event.thread_ts,
    isInThread: !!event.thread_ts,
    hasEdits: event.edited ? true : false,
    // Enhanced time analysis
    hourOfDay: hour,
    timeCategory: hour < 6 ? 'late_night' : (hour < 9 ? 'early_morning' : 
                (hour < 18 ? 'work_hours' : (hour < 22 ? 'evening' : 'late_night'))),
    dayOfWeek: messageTime.getDay(), // 0 = Sunday, 6 = Saturday
    isWeekend: [0, 6].includes(messageTime.getDay()),
    organizationId
  };
};

/**
 * Process reaction event metadata
 */
const processReactionMetadata = (event, organizationId) => {
  return {
    eventId: uuidv4(),
    source: 'slack',
    eventType: 'reaction',
    reactionType: event.reaction,
    timestamp: new Date(parseInt(event.event_ts) * 1000),
    channelId: event.item.channel,
    userId: event.user,
    itemUserId: event.item_user,
    teamId: event.team,
    itemType: event.item.type,
    itemTs: event.item.ts,
    organizationId
  };
};

/**
 * Process channel presence metadata (join/leave)
 */
const processChannelPresenceMetadata = (event, organizationId) => {
  return {
    eventId: uuidv4(),
    source: 'slack',
    eventType: event.type,
    timestamp: new Date(parseInt(event.event_ts || event.ts) * 1000),
    channelId: event.channel,
    userId: event.user,
    teamId: event.team,
    organizationId
  };
};

/**
 * Analyze channel participation to detect inactivity patterns
 * Preserves privacy by focusing on ratios rather than individuals
 * @param {Array} metadataCollection - Collection of message metadata
 * @returns {Array} - Channel participation analysis
 */
export const analyzeChannelParticipation = (metadataCollection) => {
  // Group by channel
  const channelGroups = {};
  metadataCollection.forEach(item => {
    if (item.eventType !== 'message') return; // Only analyze messages
    
    if (!channelGroups[item.channelId]) {
      channelGroups[item.channelId] = {
        messages: [],
        uniqueUsers: new Set(),
        channelId: item.channelId
      };
    }
    
    channelGroups[item.channelId].messages.push(item);
    channelGroups[item.channelId].uniqueUsers.add(item.userId);
  });
  
  // Process each channel for participation patterns
  const participationAnalysis = Object.values(channelGroups).map(channel => {
    // Get total message count
    const messageCount = channel.messages.length;
    const uniqueUserCount = channel.uniqueUsers.size;
    
    // Group by day to find daily participation
    const dayGroups = {};
    channel.messages.forEach(msg => {
      const day = new Date(msg.timestamp).toISOString().split('T')[0];
      if (!dayGroups[day]) {
        dayGroups[day] = {
          messages: [],
          uniqueUsers: new Set()
        };
      }
      
      dayGroups[day].messages.push(msg);
      dayGroups[day].uniqueUsers.add(msg.userId);
    });
    
    // Analyze participation trends
    const dailyParticipation = Object.keys(dayGroups).map(day => ({
      day,
      messageCount: dayGroups[day].messages.length,
      participantCount: dayGroups[day].uniqueUsers.size
    }));
    
    // Sort days chronologically
    dailyParticipation.sort((a, b) => new Date(a.day) - new Date(b.day));
    
    // Calculate participation trend (rising, falling, stable)
    let participationTrend = 'stable';
    if (dailyParticipation.length >= 3) {
      const first = dailyParticipation.slice(0, Math.floor(dailyParticipation.length / 2));
      const second = dailyParticipation.slice(Math.floor(dailyParticipation.length / 2));
      
      const firstAvg = first.reduce((sum, d) => sum + d.participantCount, 0) / first.length;
      const secondAvg = second.reduce((sum, d) => sum + d.participantCount, 0) / second.length;
      
      const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (percentChange > 10) participationTrend = 'rising';
      else if (percentChange < -10) participationTrend = 'falling';
    }
    
    // Calculate response gap metrics
    const responseGaps = [];
    if (channel.messages.length > 1) {
      const sortedMessages = [...channel.messages].sort((a, b) => a.timestamp - b.timestamp);
      
      for (let i = 1; i < sortedMessages.length; i++) {
        const timeDiff = sortedMessages[i].timestamp - sortedMessages[i-1].timestamp;
        const gapHours = timeDiff / (1000 * 60 * 60);
        
        if (gapHours > 1) {
          responseGaps.push({
            gapHours,
            startTime: sortedMessages[i-1].timestamp,
            endTime: sortedMessages[i].timestamp,
            // Importantly, we don't include user IDs, preserving privacy
          });
        }
      }
    }
    
    return {
      channelId: channel.channelId,
      messageCount,
      uniqueUserCount,
      dailyParticipation,
      participationTrend,
      averageParticipantsPerDay: dailyParticipation.reduce((sum, d) => sum + d.participantCount, 0) / dailyParticipation.length,
      responseGaps: responseGaps.length,
      averageResponseGap: responseGaps.length > 0 
        ? responseGaps.reduce((sum, gap) => sum + gap.gapHours, 0) / responseGaps.length 
        : 0,
      maxResponseGap: responseGaps.length > 0 
        ? Math.max(...responseGaps.map(gap => gap.gapHours)) 
        : 0,
    };
  });
  
  return participationAnalysis;
};

/**
 * Analyze emoji usage trends over time
 * @param {Array} metadataCollection - Collection of message metadata
 * @returns {Object} - Emoji usage trend analysis
 */
export const analyzeEmojiTrends = (metadataCollection) => {
  // Group by day
  const dayGroups = {};
  metadataCollection.forEach(item => {
    // Include both messages with emoji and reaction events
    if (item.eventType !== 'message' && item.eventType !== 'reaction') return;
    
    const day = new Date(item.timestamp).toISOString().split('T')[0];
    if (!dayGroups[day]) {
      dayGroups[day] = {
        day,
        messages: [],
        reactions: [],
        messagesWithEmoji: 0
      };
    }
    
    if (item.eventType === 'message') {
      dayGroups[day].messages.push(item);
      if (item.hasEmoji) {
        dayGroups[day].messagesWithEmoji++;
      }
    } else if (item.eventType === 'reaction') {
      dayGroups[day].reactions.push(item);
    }
  });
  
  // Calculate emoji usage trends
  const dailyTrends = Object.values(dayGroups).map(day => {
    const messageCount = day.messages.length;
    const reactionCount = day.reactions.length;
    const messagesWithEmojiCount = day.messagesWithEmoji;
    
    return {
      day: day.day,
      messageCount,
      reactionCount,
      messagesWithEmojiCount,
      emojiRatio: messageCount > 0 ? (messagesWithEmojiCount + reactionCount) / messageCount : 0,
      reactionsPerMessage: messageCount > 0 ? reactionCount / messageCount : 0
    };
  });
  
  // Sort chronologically
  dailyTrends.sort((a, b) => new Date(a.day) - new Date(b.day));
  
  // Calculate trend metrics
  let emojiUsageTrend = 'stable';
  let reactionTrend = 'stable';
  
  if (dailyTrends.length >= 3) {
    // Split into first and second half for comparison
    const first = dailyTrends.slice(0, Math.floor(dailyTrends.length / 2));
    const second = dailyTrends.slice(Math.floor(dailyTrends.length / 2));
    
    // Calculate average emoji ratio
    const firstAvgEmojiRatio = first.reduce((sum, d) => sum + d.emojiRatio, 0) / first.length;
    const secondAvgEmojiRatio = second.reduce((sum, d) => sum + d.emojiRatio, 0) / second.length;
    
    const emojiPercentChange = firstAvgEmojiRatio > 0 
      ? ((secondAvgEmojiRatio - firstAvgEmojiRatio) / firstAvgEmojiRatio) * 100 
      : 0;
    
    // Calculate average reactions per message
    const firstAvgReactions = first.reduce((sum, d) => sum + d.reactionsPerMessage, 0) / first.length;
    const secondAvgReactions = second.reduce((sum, d) => sum + d.reactionsPerMessage, 0) / second.length;
    
    const reactionPercentChange = firstAvgReactions > 0 
      ? ((secondAvgReactions - firstAvgReactions) / firstAvgReactions) * 100 
      : 0;
    
    // Determine trends
    if (emojiPercentChange > 20) emojiUsageTrend = 'rising';
    else if (emojiPercentChange < -20) emojiUsageTrend = 'falling';
    
    if (reactionPercentChange > 20) reactionTrend = 'rising';
    else if (reactionPercentChange < -20) reactionTrend = 'falling';
  }
  
  return {
    dailyTrends,
    emojiUsageTrend,
    reactionTrend,
    overallEmojiRatio: dailyTrends.reduce((sum, d) => sum + d.emojiRatio, 0) / dailyTrends.length,
    overallReactionsPerMessage: dailyTrends.reduce((sum, d) => sum + d.reactionsPerMessage, 0) / dailyTrends.length
  };
}; 