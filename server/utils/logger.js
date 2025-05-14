/**
 * Structured Logging Utility
 * Provides consistent logging across the application with context and metadata
 */

import winston from 'winston';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = isProduction ? 'info' : 'debug';

// Define custom format with timestamps and colorization
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    // Extract metadata and include it in the log message
    const { timestamp, level, message, ...metadata } = info;
    
    // Format message with metadata if present
    let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Create transports for different environments
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    ),
  }),
];

// Add file transports in production
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level,
  levels,
  format,
  transports,
  exitOnError: false, // Don't exit on handled exceptions
});

/**
 * Extended logger for including context and metadata
 */
export default {
  /**
   * Log at error level
   * @param {String} message - Message to log
   * @param {Object} metadata - Additional metadata
   */
  error: (message, metadata = {}) => {
    logger.error(message, metadata);
  },
  
  /**
   * Log at warn level
   * @param {String} message - Message to log
   * @param {Object} metadata - Additional metadata
   */
  warn: (message, metadata = {}) => {
    logger.warn(message, metadata);
  },
  
  /**
   * Log at info level
   * @param {String} message - Message to log
   * @param {Object} metadata - Additional metadata
   */
  info: (message, metadata = {}) => {
    logger.info(message, metadata);
  },
  
  /**
   * Log at HTTP level
   * @param {String} message - Message to log
   * @param {Object} metadata - Additional metadata
   */
  http: (message, metadata = {}) => {
    logger.http(message, metadata);
  },
  
  /**
   * Log at debug level
   * @param {String} message - Message to log
   * @param {Object} metadata - Additional metadata
   */
  debug: (message, metadata = {}) => {
    logger.debug(message, metadata);
  },
  
  /**
   * Create a child logger with context
   * @param {String} context - Context name
   * @param {Object} defaultMetadata - Default metadata to include
   * @returns {Object} - Child logger
   */
  child: (context, defaultMetadata = {}) => {
    return {
      error: (message, metadata = {}) => {
        logger.error(`[${context}] ${message}`, { ...defaultMetadata, ...metadata });
      },
      warn: (message, metadata = {}) => {
        logger.warn(`[${context}] ${message}`, { ...defaultMetadata, ...metadata });
      },
      info: (message, metadata = {}) => {
        logger.info(`[${context}] ${message}`, { ...defaultMetadata, ...metadata });
      },
      http: (message, metadata = {}) => {
        logger.http(`[${context}] ${message}`, { ...defaultMetadata, ...metadata });
      },
      debug: (message, metadata = {}) => {
        logger.debug(`[${context}] ${message}`, { ...defaultMetadata, ...metadata });
      }
    };
  },
  
  /**
   * Create Express middleware for HTTP request logging
   * @returns {Function} - Express middleware
   */
  httpLogger: () => {
    return (req, res, next) => {
      // Start timer
      const start = Date.now();
      
      // Process the request
      next();
      
      // Log once the response is sent
      res.on('finish', () => {
        // Calculate response time
        const responseTime = Date.now() - start;
        
        // Get request/response metadata
        const meta = {
          method: req.method,
          url: req.originalUrl || req.url,
          ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          userAgent: req.headers['user-agent'],
          userId: req.user?._id || 'anonymous'
        };
        
        // Log at appropriate level based on status code
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
        
        logger[level](
          `HTTP ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${responseTime}ms)`,
          meta
        );
      });
    };
  }
}; 