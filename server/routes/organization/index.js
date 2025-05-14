import express from 'express';
import scopeRoutes from './scopeRoutes.js';
import { authenticate } from '../../middleware/auth.js';
import { checkRole } from '../../middleware/roleCheck.js';
import { getSlackUsers } from '../../controllers/managerController.js';
import { getOrganizationMembers } from '../../controllers/organizationController.js';
import { configureSlackIntegration } from '../../controllers/integrationController.js';
// Import other organization routes here as needed

const router = express.Router();

// Register scope routes
router.use('/scope', scopeRoutes);

// Register organization-related routes
router.get('/:organizationId/members', authenticate, getOrganizationMembers);

// Integration routes - make sure it has the /api prefix in the actual URL
router.get('/:organizationId/integrations/slack/users', authenticate, getSlackUsers);

// Configuration routes - only org_admin should be able to configure integrations
router.post('/:organizationId/integrations/slack/config', authenticate, checkRole(['org_admin']), configureSlackIntegration);

export default router; 