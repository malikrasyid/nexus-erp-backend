import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import our custom logic
import { verifyTenant } from './middleware/tenant.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess } from './utils/response.util.js';

// Import Routes 
import resourceRoutes from './routes/resource.routes.js';
import projectRoutes from './routes/project.routes.js'
import allocationRoutes from './routes/allocation.routes.js'

dotenv.config();

const app: Application = express();

// 1. Global Standard Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads

// 2. Health Check (Public Route)
app.get('/health', (req, res) => {
  return sendSuccess(res, { status: 'NexusERP Engine Online' });
});

/** * 3. Tenant-Scoped Routes
 * Everything below this line requires a valid Supabase JWT with a tenant_id
 */
app.use(verifyTenant);

app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('api/allocations', allocationRoutes);

// 4. Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;