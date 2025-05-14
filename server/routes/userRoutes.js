import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  getUser, 
  updateUser, 
  deleteUser, 
  changePassword,
  getUserPreferences,
  updateUserPreferences,
  createFromExternal // Import the new controller function
} from '../controllers/userController.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, getUser);

// Update current user profile
router.put('/me', authenticate, updateUser);

// Delete current user
router.delete('/me', authenticate, deleteUser);

// Change password
router.put('/me/password', authenticate, changePassword);

// Get user preferences
router.get('/me/preferences', authenticate, getUserPreferences);

// Update user preferences
router.put('/me/preferences', authenticate, updateUserPreferences);

// Create user from external source (Slack, etc.) - Only for admins and org_admins
router.post('/create-from-external', authenticate, authorize('org_admin', 'super_admin'), createFromExternal);

export default router; 