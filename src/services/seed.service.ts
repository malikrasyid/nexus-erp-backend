import sql from '../config/db.js';

export const SeedService = {
  /**
   * Initializes a new Tenant with essential accounts
   */
  async seedTenantAccounts(tenantId: string) {
    const standardAccounts = [
      { name: 'Cash on Hand', code: '1001', type: 'ASSET' },
      { name: 'Accounts Receivable', code: '1200', type: 'ASSET' },
      { name: 'Inventory Assets', code: '1005', type: 'ASSET' },
      { name: 'Accounts Payable', code: '2001', type: 'LIABILITY' },
      { name: 'Owner Equity', code: '3000', type: 'EQUITY' },
      { name: 'Sales Revenue', code: '4000', type: 'REVENUE' },
      { name: 'Cost of Goods Sold', code: '5000', type: 'EXPENSE' },
      { name: 'Operational Expense', code: '5100', type: 'EXPENSE' }
    ];

    return await sql.begin(async (tx) => {
      const results = [];
      for (const acc of standardAccounts) {
        const [newAcc] = await (tx as any)`
          INSERT INTO accounts (tenant_id, name, code, type, balance)
          VALUES (${tenantId}, ${acc.name}, ${acc.code}, ${acc.type}, 0)
          ON CONFLICT (tenant_id, code) DO NOTHING
          RETURNING *
        `;
        if (newAcc) results.push(newAcc);
      }
      return results;
    });
  }
};