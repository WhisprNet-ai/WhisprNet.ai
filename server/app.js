// Import user and manager routes
import userRoutes from './routes/userRoutes.js';
import managerRoutes from './routes/managerRoutes.js';

// ... existing code ...

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/slack', slackRoutes); 