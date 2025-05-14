import express from 'express';
import { 
  createOrganization, 
  getOrganizations, 
  getOrganization, 
  getCurrentOrganization,
  updateOrganization, 
  deleteOrganization,
  getOrganizationApiKey,
  regenerateApiKey,
  getOrganizationMembers,
  getOrganizationSettings,
  updateOrganizationSettings,
  getSubscription,
  updateSubscription,
  cancelSubscription
} from '../../controllers/organization/organizationController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', createOrganization);

// Protected routes
router.use(authenticate);

// Super admin only
router.get('/', authorize('super_admin'), getOrganizations);

// Current organization routes - accessible to both org_admin and super_admin
router.get('/current', getCurrentOrganization);
router.get('/current/members', getOrganizationMembers);
router.get('/current/settings', getOrganizationSettings);
router.put('/current/settings', authorize('org_admin', 'super_admin'), updateOrganizationSettings);
router.get('/current/subscription', getSubscription);
router.put('/current/subscription', authorize('org_admin', 'super_admin'), updateSubscription);
router.delete('/current/subscription', authorize('org_admin', 'super_admin'), cancelSubscription);

// Org specific routes (protected by tenant isolation)
router.get('/:id', getOrganization);
router.put('/:id', authorize('org_admin', 'super_admin'), updateOrganization);
router.delete('/:id', authorize('super_admin'), deleteOrganization);
router.get('/:id/apikey', authorize('org_admin', 'super_admin'), getOrganizationApiKey);
router.post('/:id/apikey/regenerate', authorize('org_admin', 'super_admin'), regenerateApiKey);
router.get('/:id/members', getOrganizationMembers);

export default router; 