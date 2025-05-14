import express from 'express';
import {
  getGithubConfig,
  createUpdateGithubConfig,
  verifyGithubCredentials,
  setupGithubWebhook,
  deleteGithubConfig,
  handleGithubCallback
} from '../../controllers/github/githubConfigController.js';
import { authenticate } from '../../middleware/auth.js'; // Standardizing to use authenticate

const router = express.Router({ mergeParams: true });

// For routes that require authentication
router.use(authenticate);

// GitHub configuration routes
router
  .route('/')
  .get(getGithubConfig)
  .post(createUpdateGithubConfig)
  .put(createUpdateGithubConfig)
  .delete(deleteGithubConfig);

// GitHub verification and webhook setup
router.post('/verify-credentials', verifyGithubCredentials);
router.post('/setup-webhook', setupGithubWebhook);

// Public routes (don't require auth)
router.use('/callback', (req, res, next) => {
  // Skip auth for callback route
  next();
});
router.get('/callback', handleGithubCallback);

export default router; 