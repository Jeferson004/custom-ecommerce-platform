import pool from "../configs/db.js";

const VALID_STATUSES = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

// POST /api/orders
export const createOrder = async (req, res) => {
    const profileId = req.user.id;
    const { shipping_address_id, billing_address_id } = req.body;

    if (!shipping_address_id || !billing_address_id) {
        return res.status(400).json({
            message: "Shipping and billing addresses are required.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify both addresses belong to the authenticated profile.
        const addressResult = await client.query(
            `SELECT id
            FROM addresses
            WHERE profile_id = $1
                AND id = ANY($2::bigint[])`,
            [profileId, [shipping_address_id, billing_address_id]]
        );

        const foundAddressIds = new Set(
            addressResult.rows.map((address) => String(address.id))
        );

        if (
            !foundAddressIds.has(String(shipping_address_id)) ||
            !foundAddressIds.has(String(billing_address_id))
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "One or both addresses are invalid.",
            });
        }

        // Lock the user's cart so checkout can safely read its items.
        const cartResult = await client.query(
            `SELECT id
            FROM carts
            WHERE profile_id = $1
            FOR UPDATE`,
            [profileId]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Your cart is empty.",
            });
        }

        const cartId = cartResult.rows[0].id;

        const itemsResult = await client.query(
            `SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.is_active
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = $1
            ORDER BY ci.product_id
            FOR UPDATE OF ci`,
            [cartId]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Your cart is empty.",
            });
        }

        // Lock inventory rows and validate available stock.
        const orderItems = [];
        let totalAmount = 0;

        for (const item of itemsResult.rows) {
            if (!item.is_active) {
                throw new Error(
                    `Product ${item.product_id} is inactive and cannot be ordered.`
                );
            }

            const inventoryResult = await client.query(
                `SELECT quantity
                FROM inventory
                WHERE product_id = $1
                FOR UPDATE`,
                [item.product_id]
            );

            if (inventoryResult.rows.length === 0) {
                throw new Error(
                    `Inventory not found for product ${item.product_id}.`
                );
            }

            const availableStock = Number(inventoryResult.rows[0].quantity);
            const quantity = Number(item.quantity);
            const price = Number(item.price);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw new Error(
                    `Invalid quantity or price for product ${item.product_id}.`
                );
            }

            if (availableStock < quantity) {
                throw new Error(
                    `Insufficient stock for product ${item.product_id}.`
                );
            }

            const subtotal = Number((price * quantity).toFixed(2));

            totalAmount = Number((totalAmount + subtotal).toFixed(2));

            orderItems.push({
                product_id: item.product_id,
                quantity,
                price,
                subtotal,
            });
        }

        // Create the order.
        const orderResult = await client.query(
            `INSERT INTO orders (
                profile_id,
                status,
                total_amount,
                shipping_address_id,
                billing_address_id
            )
            VALUES ($1, 'pending', $2, $3, $4)
            RETURNING *`,
            [
                profileId,
                totalAmount,
                shipping_address_id,
                billing_address_id,
            ]
        );

        const order = orderResult.rows[0];

        // Save price snapshots and deduct inventory.
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items (
                order_id,
                product_id,
                quantity,
                price,
                subtotal
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    order.id,
                    item.product_id,
                    item.quantity,
                    item.price,
                    item.subtotal,
                ]
            );

            await client.query(
                `UPDATE inventory
                SET quantity = quantity - $1,
                    updated_at = NOW()
                WHERE product_id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // Empty the cart after the order has been created successfully.
        await client.query(
            `DELETE FROM cart_items
            WHERE cart_id = $1`,
            [cartId]
        );

        await client.query(
            `UPDATE carts
            SET updated_at = NOW()
            WHERE id = $1`,
            [cartId]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Order created successfully.",
            order,
            items: orderItems,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create order error:", error);

        if (
            error.message.startsWith("Product ") ||
            error.message.startsWith("Inventory not found") ||
            error.message.startsWith("Insufficient stock") ||
            error.message.startsWith("Invalid quantity or price")
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create order.",
        });
    } finally {
        client.release();
    }
};

// GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const profileId = req.user.id;

        const result = await pool.query(
            `SELECT *
            FROM orders
            WHERE profile_id = $1
            ORDER BY created_at DESC`,
            [profileId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            message: "Failed to retrieve orders.",
        });
    }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const orderResult = await pool.query(
            `SELECT *
            FROM orders
            WHERE id = $1 AND profile_id = $2`,
            [id, profileId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found.",
            });
        }

        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT
                oi.id,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                oi.price,
                oi.subtotal
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.id`,
            [order.id]
        );

        return res.status(200).json({
            order,
            items: itemsResult.rows,
        });
    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            message: "Failed to retrieve order.",
        });
    }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
    const { id } = req.params;
    const profileId = req.user.id;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT id, status
            FROM orders
            WHERE id = $1 AND profile_id = $2
            FOR UPDATE`,
            [id, profileId]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Order not found.",
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "pending") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Only pending orders can be cancelled.",
            });
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
            FROM order_items
            WHERE order_id = $1
            ORDER BY product_id`,
            [order.id]
        );

        // Restore the stock reserved by this order.
        for (const item of itemsResult.rows) {
            const inventoryResult = await client.query(
                `UPDATE inventory
                SET quantity = quantity + $1,
                    updated_at = NOW()
                WHERE product_id = $2
                RETURNING product_id`,
                [item.quantity, item.product_id]
            );

            if (inventoryResult.rows.length === 0) {
                throw new Error(
                    `Inventory not found for product ${item.product_id}.`
                );
            }
        }

        const updatedOrder = await client.query(
            `UPDATE orders
            SET status = 'cancelled',
                updated_at = NOW()
            WHERE id = $1
            RETURNING *`,
            [order.id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Order cancelled successfully.",
            order: updatedOrder.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Cancel order error:", error);

        return res.status(500).json({
            message: "Failed to cancel order.",
        });
    } finally {
        client.release();
    }
};