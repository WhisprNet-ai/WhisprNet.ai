import express from 'express';
import { 
  getCurrentUser,
  updateProfile,
  changePassword,
  getUserPreferences,
  updatePreferences,
  createFromExternal
} from '../../controllers/user/userController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// User profile routes
router.get('/me', getCurrentUser);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);

// User preferences routes
router.get('/me/preferences', getUserPreferences);
router.put('/me/preferences', updatePreferences);

// Create user from external source - requires admin privileges
router.post('/create-from-external', authorize('org_admin', 'super_admin'), createFromExternal);

export default router; 