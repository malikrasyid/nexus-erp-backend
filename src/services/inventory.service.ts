import sql from '../config/db.js';
import { LedgerService } from './ledger.service.js';

export interface InventoryItem {
  id?: string;
  tenantId: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  minStockLevel: number;
}

export const InventoryService = {
  async getItems(tenantId: string, showInactive = false) {
    if (showInactive) {
      return await sql`SELECT * FROM inventory WHERE tenant_id = ${tenantId} ORDER BY name ASC`;
    }
    return await sql`SELECT * FROM inventory WHERE tenant_id = ${tenantId} AND is_active = true ORDER BY name ASC`;
  },

  async toggleItemStatus(tenantId: string, itemId: string, status: boolean) {
    const [updated] = await sql`
      UPDATE inventory 
      SET is_active = ${status}, updated_at = now()
      WHERE id = ${itemId} AND tenant_id = ${tenantId}
      RETURNING id, name, is_active
    `;
    return updated;
  },

  async addItem(item: InventoryItem & { userId: string }) {
    return await sql.begin(async (tx) => {
      const [newItem] = await (tx as any)`
        INSERT INTO inventory (
          tenant_id, name, sku, category, quantity, unit_price, min_stock_level, is_active
        ) VALUES (
          ${item.tenantId}, ${item.name}, ${item.sku || null}, ${item.category || null}, 
          ${item.quantity || 0}, ${item.unitPrice || 0}, ${item.minStockLevel || 5}, true
        )
        RETURNING *
      `;

      const inventoryAccountId = await LedgerService.getAccountIdByCode(item.tenantId, '1005');
      const cashAccountId = await LedgerService.getAccountIdByCode(item.tenantId, '1001');

      const totalValue = (item.quantity || 0) * (item.unitPrice || 0);

      if (totalValue > 0) {
        await LedgerService.createJournalEntry({
          tenantId: item.tenantId,
          description: `Initial stock: ${item.name}`,
          entries: [
            { accountId: inventoryAccountId, debit: totalValue, credit: 0 }, // Increase Inventory
            { accountId: cashAccountId, debit: 0, credit: totalValue }       // Decrease Cash
          ]
        });
      }

      if (item.quantity && item.quantity > 0) {
        await (tx as any)`  
          INSERT INTO inventory_transactions (
            tenant_id, inventory_id, user_id, type, quantity_changed, reason
          ) VALUES (
            ${item.tenantId}, ${newItem.id}, ${item.userId}, 
            'IN', ${item.quantity}, 'Initial stock entry'
          )
        `;
      }

      return newItem;
    });
  },

  // 4. Get Low Stock Alert
  async getLowStock(tenantId: string) {
    return await sql`
      SELECT name, quantity, min_stock_level 
      FROM inventory 
      WHERE tenant_id = ${tenantId} AND quantity <= min_stock_level
    `;
  },

  async getTransactionHistory(tenantId: string, itemId: string) {
    return await sql`
      SELECT t.*, p.full_name as user_name, pr.name as project_name
      FROM inventory_transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      LEFT JOIN projects pr ON t.project_id = pr.id
      WHERE t.tenant_id = ${tenantId} AND t.inventory_id = ${itemId}
      ORDER BY t.created_at DESC
    `;
  },

  async adjustStock(params: {
    tenantId: string,
    userId: string,
    itemId: string,
    projectId?: string, 
    change: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER',
    reason: string
  }) {
    return await sql.begin(async (tx) => {
        const [item] = await (tx as any)`
        SELECT quantity, unit_price, is_active 
        FROM inventory 
        WHERE id = ${params.itemId} AND tenant_id = ${params.tenantId}
        FOR UPDATE`;

        if (!item) throw new Error('Item not found');
        if (!item.isActive) throw new Error('Item is inactive');

        if (item.quantity + params.change < 0) {
          throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested: ${Math.abs(params.change)}`);
        }

        const [updatedItem] = await (tx as any)`
            UPDATE inventory 
            SET quantity = quantity + ${params.change}, updated_at = now()
            WHERE id = ${params.itemId} 
            RETURNING *
        `;

        await (tx as any)`
            INSERT INTO inventory_transactions (
            tenant_id, inventory_id, project_id, user_id, type, quantity_changed, unit_price_at_time, reason
            ) VALUES (
            ${params.tenantId}, ${params.itemId}, ${params.projectId || null}, 
            ${params.userId}, ${params.type}, ${params.change}, $(item.unitPrice), ${params.reason}
            )
        `;

        return updatedItem;
    });
  }
};