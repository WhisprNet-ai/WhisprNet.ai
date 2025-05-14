import express from 'express';
import {
  createInvitation,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  acceptInvitation,
  registerFromInvitation,
  createOrganizationInvitation
} from '../../controllers/invitation/invitationController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Public routes for accepting and registering from invitations
router.get('/accept/:token', acceptInvitation);
router.post('/register/:token', registerFromInvitation);

// Protected routes
router.use(authenticate);

// Routes requiring auth
router.post('/', createInvitation);
router.get('/', getInvitations);
router.post('/:id/resend', resendInvitation);
router.delete('/:id', cancelInvitation);

// Organization invitation route - admin only
router.post('/organization', authorize('admin'), createOrganizationInvitation);

export default router; 