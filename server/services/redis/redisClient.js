import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
};

// Create a singleton Redis client
let redisClient = null;

/**
 * Get a Redis client instance (creates one if it doesn't exist)
 * @returns {Redis} Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);
    
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });
  }
  
  return redisClient;
};

/**
 * Gracefully close Redis connection
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

export default getRedisClient; 