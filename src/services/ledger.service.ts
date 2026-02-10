import sql from '../config/db.js';

export const LedgerService = {
  /**
   * Create a balanced Journal Entry
   */
  async createJournalEntry(params: {
    tenantId: string,
    description: string,
    entries: { accountId: string, debit: number, credit: number }[]
  }) {
    // 1. Validate Balance: Sum of Debits must equal Sum of Credits
    const totalDebit = params.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = params.entries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Unbalanced Entry: Debits (${totalDebit}) != Credits (${totalCredit})`);
    }

    const transactionId = crypto.randomUUID();

    return await sql.begin(async (tx) => {
      const results = [];

      for (const entry of params.entries) {
        // 2. Insert into Ledger
        const [ledgerLine] = await (tx as any)`
          INSERT INTO ledgers (tenant_id, account_id, transaction_id, debit, credit, description)
          VALUES (${params.tenantId}, ${entry.accountId}, ${transactionId}, ${entry.debit}, ${entry.credit}, ${params.description})
          RETURNING *
        `;

        // 3. Update Account Balance
        // Logic: Assets/Expenses increase with Debit. Liabilities/Equity/Revenue increase with Credit.
        await (tx as any)`
          UPDATE accounts 
          SET balance = CASE 
            WHEN type IN ('ASSET', 'EXPENSE') THEN balance + ${entry.debit} - ${entry.credit}
            ELSE balance + ${entry.credit} - ${entry.debit}
          END
          WHERE id = ${entry.accountId} AND tenant_id = ${params.tenantId}
        `;

        results.push(ledgerLine);
      }
      return results;
    });
  },

  async getAccountIdByCode(tenantId: string, code: string): Promise<string> {
    const [account] = await sql`
      SELECT id FROM accounts 
      WHERE tenant_id = ${tenantId} AND code = ${code}
    `;
    
    if (!account) {
      throw new Error(`Accounting configuration missing: Account code ${code} not found for this tenant.`);
    }
    
    return account.id;
  },

  /**
   * Trial Balance: Lists all accounts and their current balances.
   * Total Debits must equal Total Credits.
   */
  async getTrialBalance(tenantId: string) {
    return await sql`
      SELECT name, code, type, balance
      FROM accounts
      WHERE tenant_id = ${tenantId}
      ORDER BY code ASC
    `;
  },

  /**
   * Account Statement: Detailed history of a specific account.
   */
  async getAccountStatement(tenantId: string, accountId: string) {
    return await sql`
      SELECT l.*, l.created_at as date
      FROM ledgers l
      WHERE l.tenant_id = ${tenantId} AND l.account_id = ${accountId}
      ORDER BY l.created_at DESC
    `;
  },

  /**
   * Financial Summary (Balance Sheet)
   */
  async getBalanceSheet(tenantId: string) {
    const accounts = await sql`
      SELECT type, SUM(balance) as total
      FROM accounts
      WHERE tenant_id = ${tenantId}
      GROUP BY type
    `;
    
    // Logic: Assets = Liabilities + Equity
    return accounts;
  }
};