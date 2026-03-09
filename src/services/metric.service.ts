import sql from '../config/db.js';

export const MetricService = {
  /**
   * Fetches the high-level dashboard metrics for a specific tenant
   */
  getDashboardMetrics: async (tenantId: string) => {
    const [metrics] = await sql`
      SELECT 
        total_projects, 
        active_projects, 
        total_budget_allocated, 
        total_staff 
      FROM tenant_dashboard_metrics 
      WHERE tenant_id = ${tenantId}
    `;
    
    // If the view returns nothing (brand new tenant), return safe defaults
    return metrics || {
      total_projects: 0,
      active_projects: 0,
      total_budget_allocated: 0,
      total_staff: 1 // At least the admin exists!
    };
  }
};