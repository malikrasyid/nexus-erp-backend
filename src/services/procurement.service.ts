import sql from '../config/db.js';
import { LedgerService } from './ledger.service.js';

export const ProcurementService = {
  /**
   * Create a PO with multiple items
   */
  async createPurchaseOrder(tenantId: string, data: { vendor: string, items: any[] }) {
    return await sql.begin(async (tx) => {
      const total = data.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

      // 1. Create PO Header
      const [po] = await (tx as any)`
        INSERT INTO purchase_orders (tenant_id, vendor_name, total_amount, status)
        VALUES (${tenantId}, ${data.vendor}, ${total}, 'DRAFT')
        RETURNING *
      `;

      // 2. Create Line Items
      const lineItems = data.items.map(item => ({
        tenant_id: tenantId,
        purchase_order_id: po.id,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      await (tx as any)`
      INSERT INTO po_line_items 
      ${sql(lineItems, 'tenant_id', 'purchase_order_id', 'inventory_id', 'quantity', 'unit_price')}`;

      return po;
    });
  },

  /**
   * The Critical Step: Receiving the PO
   * This triggers stock updates and financial ledger entries
   */
  async receivePurchaseOrder(tenantId: string, poId: string, userId: string) {
    return await sql.begin(async (tx) => {
      // 1. Fetch PO and Items
      const [po] = await (tx as any)`
      SELECT * FROM purchase_orders 
      WHERE id = ${poId} AND tenant_id = ${tenantId} 
      FOR UPDATE`;

      if (!po || po.status === 'RECEIVED') throw new Error('PO already received or not found');

      const items = await (tx as any)`
      SELECT * FROM po_line_items WHERE purchase_order_id = ${poId}`;

      // 2. Financial Lookup (Inventory Asset & Accounts Payable)
      const invAccId = await LedgerService.getAccountIdByCode(tenantId, '1005');
      const apAccId = await LedgerService.getAccountIdByCode(tenantId, '2001');

      for (const item of items) {
        // 3. Update Inventory (Operational)
        await (tx as any)`
          UPDATE inventory 
          SET quantity = quantity + ${item.quantity}, updated_at = now()
          WHERE id = ${item.inventory_id}
        `;

        // 4. Log Inventory Transaction
        await (tx as any)`
          INSERT INTO inventory_transactions (tenant_id, inventory_id, user_id, type, quantity_changed, unit_price_at_time, reason)
          VALUES (${tenantId}, ${item.inventory_id}, ${userId}, 'IN', ${item.quantity}, ${item.unit_price}, 'PO Received: ' || ${po.vendor_name})
        `;
      }

      // 5. Post to Ledger (Financial)
      await LedgerService.createJournalEntry({
        tenantId,
        description: `PO Received: ${po.vendor_name} (${poId})`,
        entries: [
          { accountId: invAccId, debit: po.total_amount, credit: 0 }, // Increase Asset
          { accountId: apAccId, debit: 0, credit: po.total_amount }  // Increase Liability
        ]
      });

      // 6. Finalize PO Status
      const [updatedPo] = await (tx as any)`
        UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = ${poId} RETURNING *
      `;

      return updatedPo;
    });
  }
};