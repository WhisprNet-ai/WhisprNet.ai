import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { checkRole } from '../../middleware/roleCheck.js';
import { 
  assignManagerRole,
  getManagerPermissions,
  getMyPermissions,
  revokeManagerRole,
  getAvailableIntegrations,
  getMyConnections
} from '../../controllers/managerController.js';
import scopeRoutes from './scopeRoutes.js';
import insightsRoutes from './insightsRoutes.js';

const router = express.Router();

// Routes for org admin only
router.post('/assign', authenticate, checkRole(['org_admin', 'super_admin']), assignManagerRole);
router.get('/permissions', authenticate, checkRole(['org_admin', 'super_admin']), getManagerPermissions);
router.delete('/:managerId', authenticate, checkRole(['org_admin', 'super_admin']), revokeManagerRole);

// Routes for managers
router.get('/my-permissions', authenticate, checkRole(['team_manager']), getMyPermissions);
router.get('/my-connections', authenticate, checkRole(['team_manager']), getMyConnections);

// Route for all authenticated users
router.get('/available-integrations', authenticate, getAvailableIntegrations);

// Include scope routes for managers
router.use('/scope', scopeRoutes);

// Include insights routes for managers
router.use('/insights', insightsRoutes);

export default router; 