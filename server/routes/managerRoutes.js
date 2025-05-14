import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  assignManagerRole, 
  revokeManagerRole, 
  getAllManagers 
} from '../controllers/managerController.js';

const router = express.Router();

// Assign manager role to a user
router.post('/assign', authenticate, authorize('org_admin', 'super_admin'), assignManagerRole);

// Get all managers for the organization
router.get('/', authenticate, authorize('org_admin', 'super_admin'), getAllManagers);

// Revoke manager role
router.delete('/:managerId', authenticate, authorize('org_admin', 'super_admin'), revokeManagerRole);

export default router; 