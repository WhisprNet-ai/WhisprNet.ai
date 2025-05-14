// Initialize OpenTelemetry - must be first import
import './services/telemetry/tracer.js';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDatabase from './config/database.js';
import organizationRoutes from './routes/organization/organizationRoutes.js';
import authRoutes from './routes/auth/authRoutes.js';
import agentRoutes from './routes/agent/agentRoutes.js';
import invitationRoutes from './routes/invitation/invitationRoutes.js';
import dashboardRoutes from './routes/dashboard/dashboardRoutes.js';
import userRoutes from './routes/user/userRoutes.js';
import metadataInsightsRoutes from './routes/metadataInsights/metadataInsightsRoutes.js';
import slackConfigRoutes from './routes/slack/slackConfigRoutes.js';
import slackRoutes from './routes/slackRoutes.js';
import managerRoutes from './routes/organization/managerRoutes.js';
import githubConfigRoutes, { publicRouter as githubPublicRoutes } from './routes/github/githubConfigRoutes.js';
import whisperRoutes from './routes/whisper/whisperRoutes.js';
import waitlistRoutes from './routes/waitlist/waitlistRoutes.js';
import errorHandler from './middleware/error.js';
import SlackConfig from './models/SlackConfig.js';
import { 
  getSlackEventsAdapter, 
  setupSlackEventListeners, 
  slackEventAdapters
} from './services/slack/index.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import initializeQueueWorkers from './services/queue/initWorkers.js';
import { closeRedisConnection } from './services/redis/redisClient.js';
import { closeAllQueues } from './services/queue/bullMQSetup.js';
import logger from './utils/logger.js';
import rateLimit from 'express-rate-limit';

// Create named context loggers
const serverLogger = logger.child('server');
const slackLogger = logger.child('slack');

// Load environment variables
dotenv.config();

// Connect to database
serverLogger.info('Initializing server...');
connectDatabase()
  .then(() => serverLogger.info('Database connection established'))
  .catch(err => serverLogger.error('Database connection failed', { error: err.message }));

// Initialize BullMQ workers
initializeQueueWorkers();
serverLogger.info('Queue workers initialized');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3002', 'https://subashkore.in.ngrok.io', 'http://localhost:3003'],
  credentials: true
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for some URLs or IPs if needed
  skip: (req) => {
    // Example: Skip rate limiting for webhook endpoints
    return req.path.startsWith('/api/slack/events/') || 
           req.path.startsWith('/api/github/events/');
  }
});
app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Use our custom HTTP logger in production
  app.use(logger.httpLogger());
}

// IMPORTANT: Setup Slack event endpoints BEFORE applying the body parser middleware
// This ensures Slack can verify request signatures using the raw request body
const setupSlackEventEndpoints = async () => {
  try {
    slackLogger.info('Setting up Slack event endpoints for all organizations');
    
    // Get all Slack configs with a signing secret
    const slackConfigs = await SlackConfig.find({ 
      signingSecret: { $exists: true, $ne: '' }
    });
    
    slackLogger.info(`Found ${slackConfigs.length} organizations with Slack configurations`);
    
    // For each organization with a Slack config
    for (const config of slackConfigs) {
      const organizationId = config.organization.toString();
      
      try {
        // Create dedicated endpoint path
        const endpointPath = `/api/slack/events/${organizationId}`;
        
        // Get the events adapter with the org's signing secret
        const eventsAdapter = await getSlackEventsAdapter(organizationId);
        
        // Register the raw request listener
        app.use(endpointPath, (req, res, next) => {
          // Important: Do NOT parse the body before the event adapter handles it
          slackLogger.debug('Received Slack event request', { 
            organizationId,
            method: req.method,
            path: req.path
          });
          
          req.organizationId = organizationId;
          
          // Check for test header to bypass verification
          if (req.headers && req.headers['x-whisprnet-test'] === 'true') {
            slackLogger.debug('Test mode active, bypassing signature verification', { organizationId });
            
            // Extract the raw body data
            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
            });
            
            req.on('end', () => {
              try {
                // Parse the raw body
                const parsedBody = JSON.parse(rawBody);
                
                // Process the Slack event directly
                if (parsedBody.type === 'url_verification') {
                  // Handle URL verification
                  slackLogger.info('Processing URL verification challenge', { organizationId });
                  return res.json({ challenge: parsedBody.challenge });
                } else if (parsedBody.type === 'event_callback') {
                  // Handle event callback - emit the event to listeners
                  slackLogger.info('Processing event callback', { 
                    organizationId,
                    eventType: parsedBody.event.type 
                  });
                  
                  const adapter = slackEventAdapters.get(organizationId);
                  if (adapter && adapter.emit) {
                    // Emit the event to the adapter
                    const event = parsedBody.event;
                    adapter.emit(event.type, event);
                    adapter.emit('*', event);
                  }
                  return res.status(200).send('OK');
                }
                
                // Default response
                return res.status(200).send('OK');
              } catch (err) {
                slackLogger.error('Error processing test event', { 
                  organizationId,
                  error: err.message 
                });
                return res.status(400).send('Bad Request');
              }
            });
          } else {
            // Normal processing with signature verification
            return eventsAdapter.requestListener()(req, res, next);
          }
        });
        
        slackLogger.info('Slack event endpoint enabled for organization', { 
          organizationId,
          endpoint: endpointPath 
        });
      } catch (err) {
        slackLogger.error('Error setting up Slack endpoint', { 
          organizationId,
          error: err.message
        });
      }
    }
    
    slackLogger.info('Slack event endpoints setup complete');
  } catch (error) {
    slackLogger.error('Error setting up Slack event endpoints', { error: error.message });
  }
};

// Call the setup function immediately
await setupSlackEventEndpoints();

// NOW apply body parser middleware AFTER Slack events setup is complete
app.use(express.json());

// PUBLIC ROUTES - No authentication required
// Register GitHub public routes BEFORE any auth middleware
app.use('/api/organizations/:organizationId/integrations/github', githubPublicRoutes);
app.use('/api/github', githubPublicRoutes);
app.use('/api/waitlist', waitlistRoutes);

// PROTECTED API routes - these will have auth middleware applied in their route files
app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/organizations/:organizationId/metadata-insights', metadataInsightsRoutes);
app.use('/api/organizations/:organizationId/slack', slackConfigRoutes);
app.use('/api/organizations/:organizationId/github', githubConfigRoutes);
app.use('/api/organizations/:organizationId/whispers', whisperRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/api/health', (req, res) => {
  res.json({
    service: 'WhisprNet.ai API',
    status: 'running',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  serverLogger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  serverLogger.info('Received shutdown signal, closing connections...');
  
  // Close HTTP server first (stop accepting new requests)
  server.close(async () => {
    try {
      // Close BullMQ queues and workers
      await closeAllQueues();
      
      // Close Redis connection
      await closeRedisConnection();
      
      serverLogger.info('All connections closed gracefully');
      process.exit(0);
    } catch (error) {
      serverLogger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  });
  
  // Force close after 10s
  setTimeout(() => {
    serverLogger.error('Could not close connections in time, forcibly shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  serverLogger.error('Unhandled Promise Rejection', { 
    error: err.message,
    stack: err.stack
  });
  
  // Don't exit the process in production to maintain service
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  serverLogger.error('Uncaught Exception', { 
    error: err.message,
    stack: err.stack
  });
  
  // Exit with error
  process.exit(1);
});

export default app; 