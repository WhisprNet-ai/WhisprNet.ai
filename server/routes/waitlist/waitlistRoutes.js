import express from 'express';
import { joinWaitlist } from '../../controllers/waitlist/waitlistController.js';

const router = express.Router();

/**
 * @route   POST /api/waitlist
 * @desc    Add email to waitlist
 * @access  Public
 */
router.post('/', joinWaitlist);

export default router; 