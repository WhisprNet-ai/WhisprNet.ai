import { 
  getQueueScheduler, 
  getQueue, 
  createWorker, 
  QUEUES 
} from './bullMQSetup.js';
import { processSlackMetadataJob } from './slackMetadataProcessor.js';

/**
 * Initialize all BullMQ workers and schedulers
 */
export const initializeQueueWorkers = () => {
  try {
    console.log('[TRACE] Initializing BullMQ queues and workers');
    
    // Initialize queue scheduler for delayed jobs
    try {
      getQueueScheduler(QUEUES.SLACK_METADATA_ANALYSIS);
    } catch (schedulerError) {
      console.error('[TRACE] Error initializing QueueScheduler, continuing without scheduler:', schedulerError);
      // Continue without scheduler - some features like delayed jobs won't work,
      // but the application can still function
    }
    
    // Initialize queue
    getQueue(QUEUES.SLACK_METADATA_ANALYSIS);
    
    // Create worker for processing Slack metadata analysis jobs
    createWorker(
      QUEUES.SLACK_METADATA_ANALYSIS,
      processSlackMetadataJob,
      { 
        concurrency: process.env.SLACK_ANALYSIS_CONCURRENCY || 2
      }
    );
    
    console.log('[TRACE] BullMQ queues and workers initialized successfully');
  } catch (error) {
    console.error('[TRACE] Error initializing BullMQ workers:', error);
  }
};

export default initializeQueueWorkers; 