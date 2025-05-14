import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { checkRole } from '../../middleware/roleCheck.js';
import { checkManagerPermission, checkMetadataScopeAccess } from '../../middleware/scopeAuth.js';
import { getScopedMetadataInsights, getScopedMetadataMetrics } from '../../controllers/metadataInsights/scopedInsightsController.js';

const router = express.Router();

// Base authentication for all routes
router.use(authenticate);

// Scoped insights routes for team managers
router.get('/metadata/:integration', 
  checkRole(['team_manager']),
  checkManagerPermission(['slack', 'github', 'teams', 'discord', 'gmail']),
  getScopedMetadataInsights
);

router.get('/metadata/:integration/metrics', 
  checkRole(['team_manager']),
  checkManagerPermission(['slack', 'github', 'teams', 'discord', 'gmail']),
  getScopedMetadataMetrics
);

// Add other metadata insight routes here

export default router; 