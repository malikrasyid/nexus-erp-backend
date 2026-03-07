import sql from '../config/db.js';
import { LedgerService } from './ledger.service.js';

export const InvoiceService = {
  /**
   * Create a new DRAFT invoice with line items
   */
  async createInvoice(tenantId: string, data: { client_name: string, project_id?: string, items: { description: string, amount: number }[] }) {
    return await sql.begin(async (tx) => {
      // 1. Calculate the total amount dynamically from the items
      const totalAmount = data.items.reduce((sum, item) => sum + Number(item.amount), 0);

      // 2. Insert the Invoice Header
      const [invoice] = await (tx as any)`
        INSERT INTO invoices (tenant_id, client_name, project_id, total_amount, status)
        VALUES (${tenantId}, ${data.client_name}, ${data.project_id || null}, ${totalAmount}, 'DRAFT')
        RETURNING *
      `;

      // 3. Insert the Line Items (if any exist)
      if (data.items && data.items.length > 0) {
        const lineItems = data.items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          amount: item.amount
        }));

        await (tx as any)`
          INSERT INTO invoice_line_items ${sql(lineItems, 'invoice_id', 'description', 'amount')}
        `;
      }

      // Return the complete object
      return { ...invoice, items: data.items };
    });
  },

  /**
   * Fetch all invoices for a specific project, bundled with their line items
   */
  async getInvoicesByProject(tenantId: string, projectId: string) {
    // We use a LEFT JOIN and json_agg to get the invoice and its items in one query
    return await sql`
      SELECT 
        i.*,
        COALESCE(
          json_agg(ili.*) FILTER (WHERE ili.id IS NOT NULL), 
          '[]'
        ) as items
      FROM invoices i
      LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
      WHERE i.tenant_id = ${tenantId} AND i.project_id = ${projectId}
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;
  },

  /**
   * Finalize an Invoice and record Revenue in the Ledger
   * (Included here so you have the complete service in one file)
   */
  async finalizeInvoice(tenantId: string, invoiceId: string) {
    return await sql.begin(async (tx) => {
      // 1. Fetch Invoice
      const [invoice] = await (tx as any)`
        SELECT * FROM invoices 
        WHERE id = ${invoiceId} AND tenant_id = ${tenantId} 
        FOR UPDATE
      `;
      
      if (!invoice || invoice.status !== 'DRAFT') {
        throw new Error('Invoice not found or already processed');
      }

      // 2. Financial Lookup (Accounts Receivable & Sales Revenue)
      const arAccId = await LedgerService.getAccountIdByCode(tenantId, '1200');
      const revAccId = await LedgerService.getAccountIdByCode(tenantId, '4000');

      // 3. Post to Ledger
      await LedgerService.createJournalEntry({
        tenantId,
        description: `Invoice Finalized: ${invoice.client_name}`,
        entries: [
          { accountId: arAccId, debit: invoice.total_amount, credit: 0 }, 
          { accountId: revAccId, debit: 0, credit: invoice.total_amount }  
        ]
      });

      // 4. Update Invoice Status
      const [updatedInvoice] = await (tx as any)`
        UPDATE invoices SET status = 'SENT' WHERE id = ${invoiceId} RETURNING *
      `;

      return updatedInvoice;
    });
  }
};