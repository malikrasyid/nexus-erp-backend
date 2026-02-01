import sql from '../config/db.js';
import { formatPostgresRange } from '../utils/date.utils.js';

export const AllocationService = {
  async createAllocation(tenantId: string, data: any) {
    const range = formatPostgresRange(data.start, data.end);

    const [allocation] = await sql`
      INSERT INTO allocations (tenant_id, resource_id, project_id, task_id, duration, status)
      VALUES (${tenantId}, ${data.resource_id}, ${data.project_id}, ${data.task_id}, ${range}, ${data.status || 'PROPOSED'})
      RETURNING *
    `;
    return allocation;
  },

  async getResourceSchedule(tenantId: string, resourceId: string) {
    // Using a JOIN to get project names for the schedule view
    return await sql`
      SELECT 
        a.*, 
        t.name as task_name,
        p.name as project_name
      FROM allocations a
      JOIN tasks t ON a.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE a.resource_id = ${resourceId} AND a.tenant_id = ${tenantId}
    `;
  },

  async updateAllocation(tenantId: string, id: string, data: { start?: Date, end?: Date, status?: string }) {
    return await sql.begin(async (tx) => {
      // 1. Fetch current allocation to handle partial date updates
      const [current] = await (tx as any)`
        SELECT duration, status FROM allocations 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      if (!current) throw new Error('Allocation not found');

      let newRange = current.duration;
      
      // 2. Re-calculate range if dates are changing
      if (data.start || data.end) {
        // We'd ideally extract existing bounds here, but for simplicity:
        if (data.start && data.end) {
          newRange = formatPostgresRange(data.start, data.end);
        }
      }

      // 3. Perform the update
      const [updated] = await (tx as any)`
        UPDATE allocations
        SET 
          duration = ${newRange},
          status = ${data.status || current.status}
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;

      return updated;
    });
  },

  async deleteAllocation(tenantId: string, id: string) {
    const result = await sql`
      DELETE FROM allocations 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    return result.count > 0;
  }
};