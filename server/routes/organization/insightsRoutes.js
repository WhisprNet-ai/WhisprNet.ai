import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { checkRole } from '../../middleware/roleCheck.js';

const router = express.Router();

// All routes require team_manager role
router.use(authenticate, checkRole(['team_manager']));

// Scoped metadata insights routes
router.get('/metadata/:integration', (req, res) => {
  res.json({
    success: true,
    message: 'Scoped metadata insights retrieved',
    insights: [] // This would normally come from your database
  });
});

// Scoped metadata metrics routes
router.get('/metadata/:integration/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Scoped metadata metrics retrieved',
    totalCount: 0,
    averageResponseTime: 0,
    totalUsers: 0,
    totalChannels: 0
  });
});

export default router; 