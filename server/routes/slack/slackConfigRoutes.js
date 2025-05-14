import express from 'express';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';
import {
  getSlackConfig,
  createUpdateSlackConfig,
  verifySlackConfig,
  deleteSlackConfig,
  getEventsApiStatus,
  verifySlackCredentials
} from '../../controllers/slack/slackConfigController.js';

const router = express.Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(enforceTenantIsolation);

// Slack configuration routes
router.route('/')
  .get(getSlackConfig)
  .post(createUpdateSlackConfig)
  // PUT route for updating existing slack configurations
  .put(createUpdateSlackConfig)
  .delete(deleteSlackConfig);

router.post('/verify', verifySlackConfig);
router.post('/verify-credentials', verifySlackCredentials);
router.get('/events-api-status', getEventsApiStatus);

export default router; 