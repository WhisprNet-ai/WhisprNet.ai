import express from 'express';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';
import {
  getWhispers,
  getWhisper,
  createWhisper,
  updateWhisper,
  deleteWhisper,
  submitFeedback,
  deliverWhisper,
  getRecentWhispers,
  getWhisperStats
} from '../../controllers/whisper/whisperController.js';
import { getWhisperTrace } from '../../controllers/whisper/traceController.js';


// Use mergeParams to access organizationId from parent router
const router = express.Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply tenant isolation to ensure users can only access their own organization's data
router.use(enforceTenantIsolation);

// GET /api/organizations/:organizationId/whispers
router.route('/')
  .get(getWhispers)
  .post(createWhisper);

// GET /api/organizations/:organizationId/whispers/stats
router.get('/stats', getWhisperStats);

// GET /api/organizations/:organizationId/whispers/recent
router.get('/recent', getRecentWhispers);

// GET, PUT, DELETE /api/organizations/:organizationId/whispers/:id
router.route('/:id')
  .get(getWhisper)
  .put(updateWhisper)
  .delete(deleteWhisper);

// POST /api/organizations/:organizationId/whispers/:id/feedback
router.post('/:id/feedback', submitFeedback);

// POST /api/organizations/:organizationId/whispers/:id/deliver
router.post('/:id/deliver', deliverWhisper);

// GET /api/organizations/:organizationId/whispers/:id/trace
router.get('/:id/trace', getWhisperTrace);

export default router; 