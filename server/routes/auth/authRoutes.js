import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  updateDetails, 
  updatePassword, 
  refreshToken,
  adminLogin 
} from '../../controllers/auth/authController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Create a separate section for public routes to ensure clarity
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Admin login - ensure this is public and not accidentally protected
router.post('/admin/login', adminLogin);

// ===== PROTECTED ROUTES =====
// Apply authentication middleware to all routes below this
router.use(authenticate);

// User routes
router.get('/me', getMe);
router.get('/logout', logout);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// Admin protected routes - require admin privileges
router.get('/admin/me', getMe);
router.get('/admin/logout', logout);
router.put('/admin/updatedetails', authorize('super_admin'), updateDetails);
router.put('/admin/updatepassword', authorize('super_admin'), updatePassword);

export default router; 