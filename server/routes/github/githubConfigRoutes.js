import express from 'express';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';
import {
  getGithubConfig,
  createUpdateGithubConfig,
  verifyGithubCredentials,
  setupGithubWebhook,
  deleteGithubConfig,
  handleGithubCallback,
  handleGithubEvent,
  getGithubEvents
} from '../../controllers/github/githubConfigController.js';

const router = express.Router({ mergeParams: true });

// Apply authentication middleware to most routes, except public ones
// These routes are protected by authentication
router.use(authenticate);

// GitHub configuration routes
router.route('/')
  .get(getGithubConfig)
  .post(createUpdateGithubConfig)
  .put(createUpdateGithubConfig)
  .delete(deleteGithubConfig);

// Verify GitHub credentials
router.post('/verify-credentials', verifyGithubCredentials);

// Setup GitHub webhook
router.post('/setup-webhook', setupGithubWebhook);

// Create a new router for callback and webhook events that don't need authentication
const publicRouter = express.Router({ mergeParams: true });

// OAuth callback handler
publicRouter.get('/callback', handleGithubCallback);

// GitHub webhook events handler
publicRouter.post('/events', handleGithubEvent);

// GitHub webhook test endpoint
publicRouter.get('/test-events', getGithubEvents);

export { router as default, publicRouter }; 