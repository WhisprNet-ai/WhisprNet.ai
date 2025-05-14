import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { checkRole } from '../../middleware/roleCheck.js';
import { 
  defineScope,
  getScope,
  getAllScopes,
  getIntegrationItems,
  deleteScope
} from '../../controllers/insightScopeController.js';

const router = express.Router();

// All routes require team_manager role
router.use(authenticate, checkRole(['team_manager']));

// Scope management
router.post('/define', defineScope);
router.get('/:integration', getScope);
router.get('/', getAllScopes);
router.delete('/:integration', deleteScope);

// Integration item fetching
router.get('/integration/:integration/items', getIntegrationItems);

export default router; 