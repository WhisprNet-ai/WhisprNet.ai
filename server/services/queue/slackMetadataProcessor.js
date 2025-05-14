import { getRedisClient } from '../redis/redisClient.js';
import SlackMetadata from '../../models/SlackMetadata.js';
import { analyzeSlackMetadata as analyzeMetadata } from '../integrations/slackMetadataService.js';
import Whisper from '../../models/Whisper.js';
import { v4 as uuidv4 } from 'uuid';

// Constants for Redis keys
const getRedisCountKey = (organizationId) => `slack:org:${organizationId}:count`;
const getRedisDelayedKey = (organizationId) => `slack:org:${organizationId}:delayed`;

/**
 * Process a batched Slack metadata analysis job
 * @param {Object} job - BullMQ job object
 */
export const processSlackMetadataJob = async (job) => {
  const { organizationId } = job.data;
  console.log(`[TRACE] Processing slack metadata job for org ${organizationId}`);
  
  try {
    // Get Redis client
    const redis = getRedisClient();
    
    // Reset counters in Redis
    await redis.del(getRedisCountKey(organizationId));
    await redis.del(getRedisDelayedKey(organizationId));
    
    // Get all unprocessed metadata for this organization
    const metadata = await SlackMetadata.find({
      organizationId,
      processingStatus: 'pending'
    }).sort({ timestamp: 1 }).limit(10000); // Limit for safety
    
    console.log(`[TRACE] Found ${metadata.length} items to process for org ${organizationId}`);
    
    if (metadata.length === 0) {
      console.log(`[TRACE] No pending metadata to process for org ${organizationId}`);
      return { success: true, processed: 0 };
    }
    
    // Process this batch - using the imported function with the correct parameters
    // The imported function expects organizationId first, then metadata
    const results = await analyzeMetadata(organizationId, metadata);
    
    // Mark items as processed
    await SlackMetadata.updateMany(
      { 
        _id: { $in: metadata.map(m => m._id) }
      },
      {
        $set: { processingStatus: 'processed' }
      }
    );
    
    // Log successful processing
    console.log(`[TRACE] Successfully processed ${metadata.length} items for org ${organizationId}`);
    console.log(`[TRACE] Analysis results: ${JSON.stringify(results)}`);
    
    return { 
      success: true, 
      processed: metadata.length,
      results
    };
  } catch (error) {
    console.error(`[TRACE] Error processing slack metadata job:`, error);
    
    // Create error log
    try {
      await Whisper.create({
        whisperId: `whspr_error_${Date.now()}${Math.floor(Math.random() * 10000)}`,
        organizationId,
        title: 'Error Processing Metadata',
        category: 'warning',
        priority: 2, // High priority
        content: {
          message: `Error processing metadata: ${error.message}`,
          suggestedActions: ['Check system logs for details']
        },
        metadata: {
          source: 'slack-metadata-processor',
          dataPoints: {
            error: error.stack
          }
        }
      });
    } catch (logError) {
      console.error(`[TRACE] Error creating error log:`, logError);
    }
    
    throw error;
  }
}; 