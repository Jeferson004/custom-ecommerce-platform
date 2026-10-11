import pool from "../configs/db.js";


// GET /api/products
export const getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
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
            LEFT JOIN categories c
                ON p.category_id = c.id
            ORDER BY p.id ASC
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve products."
        });
    }
};


// GET /api/products/:id
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
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
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve product."
        });
    }
};


// POST /api/products
export const createProduct = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            price,
            sku,
            is_active
        } = req.body;

        // Basic validation
        if (!category_id) {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Product name is required."
            });
        }

        if (price === undefined || price === null || price === "") {
            return res.status(400).json({
                message: "Product price is required."
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                message: "Product price cannot be negative."
            });
        }

        // Check whether category exists
        const categoryResult = await pool.query(
            `
            SELECT id
            FROM categories
            WHERE id = $1
            `,
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Category does not exist."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO products (
                category_id,
                name,
                description,
                price,
                sku,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                category_id,
                name.trim(),
                description || null,
                price,
                sku || null,
                is_active ?? true
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        // PostgreSQL unique constraint
        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists."
            });
        }

        res.status(500).json({
            message: "Failed to create product."
        });
    }
};


// PUT /api/products/:id
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category_id,
            name,
            description,
            price,
            sku,
            is_active
        } = req.body;

        if (!category_id) {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Product name is required."
            });
        }

        if (price === undefined || price === null || price === "") {
            return res.status(400).json({
                message: "Product price is required."
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                message: "Product price cannot be negative."
            });
        }

        // Check category
        const categoryResult = await pool.query(
            `
            SELECT id
            FROM categories
            WHERE id = $1
            `,
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Category does not exist."
            });
        }

        const result = await pool.query(
            `
            UPDATE products
            SET
                category_id = $1,
                name = $2,
                description = $3,
                price = $4,
                sku = $5,
                is_active = $6,
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
            `,
            [
                category_id,
                name.trim(),
                description || null,
                price,
                sku || null,
                is_active ?? true,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists."
            });
        }

        res.status(500).json({
            message: "Failed to update product."
        });
    }
};


// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json({
            message: "Product deleted successfully."
        });

    } catch (error) {
        console.error(error);

        // Foreign-key constraint
        if (error.code === "23503") {
            return res.status(409).json({
                message: "Product cannot be deleted because it is being used by another record."
            });
        }

        res.status(500).json({
            message: "Failed to delete product."
        });
    }
};