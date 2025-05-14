import express from 'express';
import { handleGithubEvent } from '../../controllers/github/githubEventsController.js';
import { getGithubEvents } from '../../controllers/github/githubConfigController.js';

const router = express.Router();

// Webhook endpoint (public - secured by webhook secrets)
router.post('/events', handleGithubEvent);

// Testing endpoint
router.get('/test-events', getGithubEvents);

export default router; 