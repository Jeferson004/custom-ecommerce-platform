
import pool from "../configs/db.js";

// GET /api/categories
export const findAllCategories = async () => {
    const result = await pool.query(
        `SELECT *
         FROM categories
         ORDER BY id ASC`
    );

    return result.rows;
};

// GET /api/categories/:id
export const findCategoryById = async (id) => {
    const result = await pool.query(
        `SELECT *
         FROM categories
         WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

// POST /api/categories
export const createCategory = async (name, description) => {
    const result = await pool.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
         RETURNING *`,
        [name, description || null]
    );

    return result.rows[0];
};

// PUT /api/categories/:id
export const updateCategory = async (id, name, description) => {
    const result = await pool.query(
        `UPDATE categories
         SET
            name = $1,
            description = $2,
            updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [name, description || null, id]
    );

    return result.rows[0] || null;
};

// DELETE /api/categories/:id
export const deleteCategory = async (id) => {
    const result = await pool.query(
        `DELETE FROM categories
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0] || null;
};
