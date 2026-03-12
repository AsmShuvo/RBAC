import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import permissionsRoutes from './routes/permissions.js';
import auditRoutes from './routes/audit.js';
import rolesRoutes from './routes/roles.js';
import teamRoutes from './routes/team.js';
import customerPortalRoutes from './routes/customer-portal.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { apiLimiter } from './middleware/rateLimiter.js';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply global rate limiter to API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/customer-portal', customerPortalRoutes);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    const server = app.listen(config.server.port, () => {
      console.log(`✓ Server running on port ${config.server.port}`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
