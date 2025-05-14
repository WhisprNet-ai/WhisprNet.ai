import express from 'express';
import { getSlackUsers } from '../controllers/slackController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Route to get Slack users directly from Slack API
router.get('/users', 
  authenticate, 
  checkRole(['org_admin', 'team_manager']), 
  getSlackUsers
);

export default router; 