import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import our custom logic
import { authenticate } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess } from './utils/response.util.js';

// Import Routes 
import resourceRoutes from './routes/resource.routes.js';
import projectRoutes from './routes/project.routes.js';
import allocationRoutes from './routes/allocation.routes.js';
import financeRoutes from './routes/finance.routes.js';
import userRoutes from './routes/user.routes.js'


const app: Application = express();

// 1. Global Security
app.use(helmet()); // Adds security headers
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads

// 2. Health Check (Public Route)
app.get('/health', (req, res) => {
  return sendSuccess(res, { status: 'NexusERP Engine Online' });
});

/** * 3. Tenant-Scoped Routes
 * Everything below this line requires a valid Supabase JWT with a tenant_id
 */
app.use('/api', authenticate);

app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);

// 4. Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;