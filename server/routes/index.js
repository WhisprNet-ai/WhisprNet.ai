import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import organizationRoutes from './organization/index.js';
import managerRoutes from './organization/managerRoutes.js';
// Import other route modules as needed

const router = express.Router();

// Register routes with appropriate prefixes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/managers', managerRoutes);
// Register other routes as needed

export default router; 