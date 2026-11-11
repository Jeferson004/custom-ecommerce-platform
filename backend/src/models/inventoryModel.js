import pool from '../configs/db.js';

// GET /api/inventory
export const findAllInventory = async () => {
    const result = await pool.query(
        `SELECT
            i.id,
            i.product_id,
            p.name AS product_name,
            i.quantity,
            i.updated_at
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         ORDER BY i.id ASC`,
    );

    return result.rows;
};

// GET /api/inventory/:productId
export const findInventoryByProductId = async (productId) => {
    const result = await pool.query(
        `SELECT
            i.id,
            i.product_id,
            p.name AS product_name,
            i.quantity,
            i.updated_at
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.product_id = $1`,
        [productId],
    );

    return result.rows[0] || null;
};

// Check whether a product exists
export const findProductById = async (productId) => {
    const result = await pool.query(
        `SELECT id
         FROM products
         WHERE id = $1`,
        [productId],
    );

    return result.rows[0] || null;
};

// Check whether inventory already exists for a product
export const findInventoryRecordByProductId = async (productId) => {
    const result = await pool.query(
        `SELECT id
         FROM inventory
         WHERE product_id = $1`,
        [productId],
    );

    return result.rows[0] || null;
};

// POST /api/inventory
export const createInventory = async (productId, quantity, adjustedBy) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create the inventory record.
        const inventoryResult = await client.query(
            `INSERT INTO inventory (product_id, quantity)
             VALUES ($1, $2)
             RETURNING *`,
            [productId, quantity],
        );

        const inventory = inventoryResult.rows[0];

        // Record initial stock if quantity is greater than zero.
        if (quantity > 0) {
            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id,
                    quantity_before,
                    quantity_change,
                    quantity_after,
                    reason,
                    adjusted_by
                )
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [productId, 0, quantity, quantity, 'restock', adjustedBy],
            );
        }

        await client.query('COMMIT');

        return inventory;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// PUT /api/inventory/:productId
export const updateInventory = async (productId, quantity, adjustedBy) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Retrieve and lock the current inventory record.
        const inventoryResult = await client.query(
            `SELECT product_id, quantity
             FROM inventory
             WHERE product_id = $1
             FOR UPDATE`,
            [productId],
        );

        if (inventoryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const currentInventory = inventoryResult.rows[0];
        const quantityBefore = currentInventory.quantity;
        const quantityChange = quantity - quantityBefore;
        const quantityAfter = quantity;

        // Update inventory only when the quantity changes.
        if (quantityChange !== 0) {
            const updateResult = await client.query(
                `UPDATE inventory
                 SET
                    quantity = $1,
                    updated_at = NOW()
                 WHERE product_id = $2
                 RETURNING *`,
                [quantityAfter, productId],
            );

            const inventory = updateResult.rows[0];

            // Determine the transaction reason.
            const reason = quantityChange > 0 ? 'restock' : 'adjustment';

            // Record the inventory transaction.
            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id,
                    quantity_before,
                    quantity_change,
                    quantity_after,
                    reason,
                    adjusted_by
                )
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [productId, quantityBefore, quantityChange, quantityAfter, reason, adjustedBy],
            );

            await client.query('COMMIT');

            return inventory;
        }

        // No quantity change: return the existing inventory.
        await client.query('COMMIT');

        return currentInventory;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// GET /api/inventory/transactions
export const findAllInventoryTransactions = async () => {
    const result = await pool.query(
        `SELECT
            t.id,
            t.product_id,
            p.name AS product_name,
            t.quantity_before,
            t.quantity_change,
            t.quantity_after,
            t.reason,
            t.adjusted_by,
            t.reference_id,
            t.created_at
         FROM inventory_transactions t
         JOIN products p ON t.product_id = p.id
         ORDER BY t.created_at DESC, t.id DESC`,
    );

    return result.rows;
};
