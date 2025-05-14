import express from 'express';
import { 
  getDashboardMetrics,
  getIntegrationStatus,
  getRecentActivity,
  getWhisperStats,
  getTeamStats
} from '../../controllers/dashboard/dashboardController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard routes
router.get('/metrics', getDashboardMetrics);
router.get('/integrations/status', getIntegrationStatus);
router.get('/activity', getRecentActivity);
router.get('/whispers/stats', getWhisperStats);
router.get('/team/stats', getTeamStats);

export default router; 