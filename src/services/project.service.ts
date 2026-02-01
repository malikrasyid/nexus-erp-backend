import sql from '../config/db.js';
import { Project, Task } from '../models/project.js';

export const ProjectService = {
  async createProject(tenantId: string, projectData: Partial<Project>, initialTasks: Partial<Task>[] = []) {
    // Begin Transaction
    return await sql.begin(async (tx) => {
      // 1. Insert Project
      const [project] = await (tx as any)`
        INSERT INTO projects (tenant_id, name, status, metadata)
        VALUES (${tenantId}, ${projectData.name!}, ${projectData.status || 'PLANNING'}, ${sql.json(projectData.metadata || {})})
        RETURNING *
      `;

      // 2. Insert Tasks in bulk if they exist
      if (initialTasks.length > 0) {
        const tasksWithIds = initialTasks.map(t => ({
          tenant_id: tenantId,
          project_id: project.id,
          name: t.name,
          estimated_hours: t.estimated_hours || 0
        }));

        await (tx as any)`
          INSERT INTO tasks ${sql(tasksWithIds, 'tenant_id', 'project_id', 'name', 'estimated_hours')}
        `;
      }

      return project;
    });
  },

  async getProjectDetails(tenantId: string, projectId: string) {
    // Using a JOIN instead of two separate queries
    const rows = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = ${projectId} AND p.tenant_id = ${tenantId}
      GROUP BY p.id
    `;
    return rows[0];
  },

  async getAllProjects(tenantId: string) {
    return await sql<Project[]>`
      SELECT 
        id, 
        name, 
        status, 
        metadata
      FROM projects 
      WHERE tenant_id = ${tenantId}
    `;
  },

  async updateProject(tenantId: string, projectId: string, updates: Partial<Project>) {
    // Only allow updating specific columns for safety
    const [project] = await sql`
      UPDATE projects 
      SET ${sql(updates, 'name', 'status', 'metadata')}
      WHERE id = ${projectId} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    if (!project) throw new Error('Project not found or access denied');
    return project;
  },

  async deleteProject(tenantId: string, projectId: string) {
    // Advanced SQL Tip: If your DB has foreign key constraints with ON DELETE CASCADE, 
    // deleting the project will automatically remove all associated tasks and allocations.
    const result = await sql`
      DELETE FROM projects 
      WHERE id = ${projectId} AND tenant_id = ${tenantId}
      RETURNING id
    `;
    
    return result.count > 0;
  }
};