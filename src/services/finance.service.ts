import sql from '../config/db.js';

export const FinanceService = {
  /**
   * Calculate Project Profitability using CTEs
   */
  async getProjectFinancials(tenantId: string, projectId: string) {
    const [report] = await sql`
      WITH financials AS (
        SELECT 
          SUM(amount) FILTER (WHERE type = 'INCOME') as total_income,
          SUM(amount) FILTER (WHERE type = 'EXPENSE') as total_expenses
        FROM transactions
        WHERE project_id = ${projectId} AND tenant_id = ${tenantId}
      )
      SELECT 
        COALESCE(total_income, 0) as income,
        COALESCE(total_expenses, 0) as expenses,
        (COALESCE(total_income, 0) - COALESCE(total_expenses, 0)) as net_profit
      FROM financials
    `;
    return report;
  },

  /**
   * Record a new transaction
   */
  async recordTransaction(tenantId: string, data: any) {
    const [transaction] = await sql`
      INSERT INTO transactions (
        tenant_id, project_id, amount, type, category, description
      ) VALUES (
        ${tenantId}, ${data.projectId}, ${data.amount}, ${data.type}, ${data.category}, ${data.description}
      )
      RETURNING *
    `;
    return transaction;
  },

  /**
   * Advanced SQL: Monthly Cashflow Report
   * Uses date_trunc to group transactions by month
   */
  async getMonthlyCashflow(tenantId: string) {
    return await sql`
      SELECT 
        date_trunc('month', recorded_at) as month,
        SUM(amount) FILTER (WHERE type = 'INCOME') as income,
        SUM(amount) FILTER (WHERE type = 'EXPENSE') as expenses
      FROM transactions
      WHERE tenant_id = ${tenantId}
      GROUP BY month
      ORDER BY month DESC
    `;
  },

  async generateAllocationExpense(tenantId: string, allocationId: string) {
    return await sql.begin(async (tx) => {
      // 1. Calculate cost using SQL interval math
      // We extract the hours from the duration range and multiply by unit_cost
      const [costing] = await (tx as any)`
        SELECT 
          a.project_id,
          a.resource_id,
          r.name as resource_name,
          r.unit_cost,
          -- Extract hours from the TSRANGE duration
          ROUND((EXTRACT(EPOCH FROM (upper(a.duration) - lower(a.duration))) / 3600)::numeric, 2) as hours_worked
        FROM allocations a
        JOIN resources r ON a.resource_id = r.id
        WHERE a.id = ${allocationId} AND a.tenant_id = ${tenantId}
      `;

      if (!costing) throw new Error('Allocation or Resource not found');

      const totalAmount = costing.unitCost * costing.hoursWorked;

      // 2. Insert into transactions
      const [transaction] = await (tx as any)`
        INSERT INTO transactions (
          tenant_id, 
          project_id, 
          amount, 
          type, 
          category, 
          description
        ) VALUES (
          ${tenantId}, 
          ${costing.projectId}, 
          ${totalAmount}, 
          'EXPENSE', 
          'LABOR', 
          ${`Automated billing for ${costing.resourceName}: ${costing.hoursWorked} hours`}
        )
        RETURNING *
      `;

      // 3. Mark allocation as 'BILLED' so we don't double-charge
      await (tx as any)`
        UPDATE allocations 
        SET status = 'CONFIRMED' -- or create a 'BILLED' status
        WHERE id = ${allocationId}
      `;

      return transaction;
    });
  }
};