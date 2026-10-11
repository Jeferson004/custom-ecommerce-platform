import pool from "../configs/db.js";


// GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM categories
            ORDER BY id ASC
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve categories."
        });
    }
};


// GET /api/categories/:id
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM categories
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve category."
        });
    }
};


// POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO categories
                (name, description)
            VALUES
                ($1, $2)
            RETURNING *
            `,
            [
                name.trim(),
                description || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create category."
        });
    }
};


// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const result = await pool.query(
            `
            UPDATE categories
            SET
                name = $1,
                description = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
            `,
            [
                name.trim(),
                description || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update category."
        });
    }
};


// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM categories
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json({
            message: "Category deleted successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete category."
        });
    }
};