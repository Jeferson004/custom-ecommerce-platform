import pool from "../configs/db.js";

// GET /api/products
export const findAllProducts = async () => {
    const result = await pool.query(
        `SELECT
            p.id,
            p.category_id,
            p.name,
            p.description,
            p.price,
            p.sku,
            p.is_active,
            p.created_at,
            p.updated_at,
            c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.id ASC`
    );

    return result.rows;
};

// GET /api/products/:id
export const findProductById = async (id) => {
    const result = await pool.query(
        `SELECT
            p.id,
            p.category_id,
            p.name,
            p.description,
            p.price,
            p.sku,
            p.is_active,
            p.created_at,
            p.updated_at,
            c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

// Check whether a category exists.
export const findCategoryById = async (categoryId) => {
    const result = await pool.query(
        `SELECT id
         FROM categories
         WHERE id = $1`,
        [categoryId]
    );

    return result.rows[0] || null;
};

// POST /api/products
export const createProduct = async (productData) => {
    const {
        category_id,
        name,
        description,
        price,
        sku,
        is_active,
    } = productData;

    const result = await pool.query(
        `INSERT INTO products (
            category_id,
            name,
            description,
            price,
            sku,
            is_active
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            category_id,
            name,
            description,
            price,
            sku,
            is_active,
        ]
    );

    return result.rows[0];
};

// PUT /api/products/:id
export const updateProduct = async (id, productData) => {
    const {
        category_id,
        name,
        description,
        price,
        sku,
        is_active,
    } = productData;

    const result = await pool.query(
        `UPDATE products
         SET
            category_id = $1,
            name = $2,
            description = $3,
            price = $4,
            sku = $5,
            is_active = $6,
            updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
            category_id,
            name,
            description,
            price,
            sku,
            is_active,
            id,
        ]
    );

    return result.rows[0] || null;
};

// DELETE /api/products/:id
export const deleteProduct = async (id) => {
    const result = await pool.query(
        `DELETE FROM products
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0] || null;
};