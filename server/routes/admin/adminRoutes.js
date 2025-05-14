import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

// Import controllers
import {
  getAdminDashboardMetrics,
  getRecentWhispers,
  getTotalStats,
  getSystemStatus,
  getUserCounts
} from '../../controllers/admin/adminController.js';

const router = express.Router();

// All admin routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// Dashboard metrics
router.get('/dashboard/metrics', getAdminDashboardMetrics);

// Recent whispers across all organizations
router.get('/whispers/recent', getRecentWhispers);

// Total stats (organizations, users, whispers)
router.get('/stats/totals', getTotalStats);

// System status
router.get('/system/status', getSystemStatus);

// User counts by organization
router.get('/users/counts', getUserCounts);

export default router; 