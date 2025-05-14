import pkg from 'bullmq';
const { Queue, Worker } = pkg;  // QueueScheduler is not available in v4.10.0
import { getRedisClient } from '../redis/redisClient.js';
import dotenv from 'dotenv';

dotenv.config();

// Debug the imported module
console.log('BullMQ imports:', { 
  Queue: typeof Queue, 
  Worker: typeof Worker
});

// Redis connection for BullMQ - use the format required by BullMQ v4.10.0
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

console.log('Redis connection options:', redisOptions);

// Queue names
export const QUEUES = {
  SLACK_METADATA_ANALYSIS: 'slack-metadata-analysis'
};

// Default job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000 // 5 seconds initial delay
  },
  removeOnComplete: true,
  removeOnFail: false
};

// Create queues
const queues = {};

/**
 * Get a BullMQ queue instance
 * @param {string} queueName - Name of the queue
 * @returns {Queue} Queue instance
 */
export const getQueue = (queueName) => {
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, { 
      connection: redisOptions,
      defaultJobOptions
    });
    console.log(`Created queue: ${queueName}`);
  }
  return queues[queueName];
};

// Map of active queue schedulers
const schedulers = {};

/**
 * Custom implementation since QueueScheduler isn't available in v4.10.0
 * This provides a compatible API but uses direct queue methods instead
 * @param {string} queueName - Name of the queue
 * @returns {Object} Compatible scheduler interface
 */
export const getQueueScheduler = (queueName) => {
  console.log('Creating custom scheduler for:', queueName);
  
  if (!schedulers[queueName]) {
    // Get or create the queue
    const queue = getQueue(queueName);
    
    // Create a custom scheduler that provides the basic API
    schedulers[queueName] = {
      queue,
      name: queueName,
      // Basic compatible interface
      close: async () => {
        console.log(`Closing custom scheduler for ${queueName}`);
        return Promise.resolve();
      },
      // Add other methods as needed
    };
    
    console.log(`Started custom scheduler for queue: ${queueName}`);
  }
  
  return schedulers[queueName];
};

// Map of active workers
const workers = {};

/**
 * Create a worker for processing jobs
 * @param {string} queueName - Name of the queue
 * @param {Function} processor - Job processor function
 * @param {Object} options - Worker options
 * @returns {Worker} Worker instance
 */
export const createWorker = (queueName, processor, options = {}) => {
  if (workers[queueName]) {
    console.log(`Worker for ${queueName} already exists`);
    return workers[queueName];
  }

  const defaultOptions = {
    connection: redisOptions,
    concurrency: process.env.QUEUE_CONCURRENCY || 3,
    ...options
  };

  workers[queueName] = new Worker(queueName, processor, defaultOptions);
  
  // Set up event listeners
  workers[queueName].on('completed', (job) => {
    console.log(`Job ${job.id} in ${queueName} completed successfully`);
  });
  
  workers[queueName].on('failed', (job, error) => {
    console.error(`Job ${job?.id} in ${queueName} failed:`, error);
  });
  
  workers[queueName].on('error', (error) => {
    console.error(`Worker for ${queueName} encountered error:`, error);
  });

  console.log(`Started worker for queue: ${queueName}`);
  return workers[queueName];
};

/**
 * Gracefully close all queues, schedulers and workers
 */
export const closeAllQueues = async () => {
  // Close workers
  await Promise.all(
    Object.values(workers).map(worker => worker.close())
  );
  
  // Close schedulers (our custom implementation just logs)
  await Promise.all(
    Object.values(schedulers).map(scheduler => scheduler.close())
  );
  
  // Close queues
  await Promise.all(
    Object.values(queues).map(queue => queue.close())
  );
  
  console.log('All BullMQ queues, schedulers and workers closed');
}; 