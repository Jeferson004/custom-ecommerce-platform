import pool from "../configs/db.js";

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
         ORDER BY i.id ASC`
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
        [productId]
    );

    return result.rows[0] || null;
};

// Check whether a product exists
export const findProductById = async (productId) => {
    const result = await pool.query(
        `SELECT id
         FROM products
         WHERE id = $1`,
        [productId]
    );

    return result.rows[0] || null;
};

// Check whether inventory already exists for a product
export const findInventoryRecordByProductId = async (productId) => {
    const result = await pool.query(
        `SELECT id
         FROM inventory
         WHERE product_id = $1`,
        [productId]
    );

    return result.rows[0] || null;
};

// POST /api/inventory
export const createInventory = async (productId, quantity) => {
    const result = await pool.query(
        `INSERT INTO inventory (product_id, quantity)
         VALUES ($1, $2)
         RETURNING *`,
        [productId, quantity]
    );

    return result.rows[0];
};

// PUT /api/inventory/:productId
export const updateInventory = async (productId, quantity) => {
    const result = await pool.query(
        `UPDATE inventory
         SET
            quantity = $1,
            updated_at = NOW()
         WHERE product_id = $2
         RETURNING *`,
        [quantity, productId]
    );

    return result.rows[0] || null;
};