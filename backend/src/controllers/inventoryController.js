import pool from "../configs/db.js";


// GET /api/inventory
export const getInventory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                i.id,
                i.product_id,
                p.name AS product_name,
                i.quantity,
                i.updated_at
            FROM inventory i
            JOIN products p
                ON i.product_id = p.id
            ORDER BY i.id ASC
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve inventory."
        });
    }
};


// GET /api/inventory/:productId
export const getInventoryByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        const result = await pool.query(
            `
            SELECT
                i.id,
                i.product_id,
                p.name AS product_name,
                i.quantity,
                i.updated_at
            FROM inventory i
            JOIN products p
                ON i.product_id = p.id
            WHERE i.product_id = $1
            `,
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory record not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve inventory."
        });
    }
};


// POST /api/inventory
export const createInventory = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id) {
            return res.status(400).json({
                message: "Product ID is required."
            });
        }

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === ""
        ) {
            return res.status(400).json({
                message: "Quantity is required."
            });
        }

        if (!Number.isInteger(Number(quantity))) {
            return res.status(400).json({
                message: "Quantity must be an integer."
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message: "Quantity cannot be negative."
            });
        }

        // Check product
        const productResult = await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = $1
            `,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            return res.status(400).json({
                message: "Product does not exist."
            });
        }

        // Check whether inventory already exists
        const inventoryResult = await pool.query(
            `
            SELECT id
            FROM inventory
            WHERE product_id = $1
            `,
            [product_id]
        );

        if (inventoryResult.rows.length > 0) {
            return res.status(409).json({
                message: "Inventory already exists for this product."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO inventory (
                product_id,
                quantity
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [product_id, quantity]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create inventory."
        });
    }
};


// PUT /api/inventory/:productId
export const updateInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === ""
        ) {
            return res.status(400).json({
                message: "Quantity is required."
            });
        }

        if (!Number.isInteger(Number(quantity))) {
            return res.status(400).json({
                message: "Quantity must be an integer."
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message: "Quantity cannot be negative."
            });
        }

        const result = await pool.query(
            `
            UPDATE inventory
            SET
                quantity = $1,
                updated_at = NOW()
            WHERE product_id = $2
            RETURNING *
            `,
            [quantity, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory record not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update inventory."
        });
    }
};