import sql from '../config/db.js';
import { LedgerService } from './ledger.service.js';

export const InvoiceService = {
  /**
   * Finalize an Invoice and record Revenue
   */
  async finalizeInvoice(tenantId: string, invoiceId: string) {
    return await sql.begin(async (tx) => {
      // 1. Fetch Invoice
      const [invoice] = await (tx as any)`
        SELECT * FROM invoices 
        WHERE id = ${invoiceId} AND tenant_id = ${tenantId} 
        FOR UPDATE
      `;
      if (!invoice || invoice.status !== 'DRAFT') throw new Error('Invoice not found or already processed');

      // 2. Financial Lookup (Accounts Receivable & Sales Revenue)
      const arAccId = await LedgerService.getAccountIdByCode(tenantId, '1200');
      const revAccId = await LedgerService.getAccountIdByCode(tenantId, '4000');

      // 3. Post to Ledger
      await LedgerService.createJournalEntry({
        tenantId,
        description: `Invoice Finalized: ${invoice.client_name}`,
        entries: [
          { accountId: arAccId, debit: invoice.total_amount, credit: 0 }, // Increase what is owed to us
          { accountId: revAccId, debit: 0, credit: invoice.total_amount }  // Increase Revenue
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