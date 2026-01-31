import sql from '../config/db.js';

export const AdminService = {
    
  //Cleans up orphaned tasks for a specific tenant
  async cleanupOrphanedTasks(tenantId: string) {
    const result = await sql`
      DELETE FROM tasks t
      WHERE t.tenant_id = ${tenantId}
      AND NOT EXISTS (
        SELECT 1 
        FROM projects p 
        WHERE p.id = t.project_id
      )
      RETURNING id
    `;
    
    return {
      success: true,
      count: result.count,
      deletedIds: result.map(r => r.id)
    };
  }
};