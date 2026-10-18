import pool from "../configs/db.js";

// GET /api/orders
export const findOrdersByProfileId = async (profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM orders
         WHERE profile_id = $1
         ORDER BY created_at DESC`,
        [profileId]
    );

    return result.rows;
};

// GET /api/orders/:id
export const findOrderById = async (id, profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM orders
         WHERE id = $1 AND profile_id = $2`,
        [id, profileId]
    );

    return result.rows[0] || null;
};

// Get order items
export const findOrderItemsByOrderId = async (orderId) => {
    const result = await pool.query(
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
        [orderId]
    );

    return result.rows;
};

// POST /api/orders
export const createOrder = async (
    profileId,
    shippingAddressId,
    billingAddressId
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify both addresses belong to this user.
        const addressResult = await client.query(
            `SELECT id
             FROM addresses
             WHERE profile_id = $1
               AND id = ANY($2::bigint[])`,
            [profileId, [shippingAddressId, billingAddressId]]
        );

        const foundAddressIds = new Set(
            addressResult.rows.map((address) => String(address.id))
        );

        if (
            !foundAddressIds.has(String(shippingAddressId)) ||
            !foundAddressIds.has(String(billingAddressId))
        ) {
            const error = new Error(
                "One or both addresses are invalid."
            );
            error.statusCode = 400;
            throw error;
        }

        // Lock the user's cart during checkout.
        const cartResult = await client.query(
            `SELECT id
             FROM carts
             WHERE profile_id = $1
             FOR UPDATE`,
            [profileId]
        );

        if (cartResult.rows.length === 0) {
            const error = new Error("Your cart is empty.");
            error.statusCode = 400;
            throw error;
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
            const error = new Error("Your cart is empty.");
            error.statusCode = 400;
            throw error;
        }

        // Lock inventory and validate every item before creating the order.
        const orderItems = [];
        let totalAmount = 0;

        for (const item of itemsResult.rows) {
            if (!item.is_active) {
                const error = new Error(
                    `Product ${item.product_id} is inactive and cannot be ordered.`
                );
                error.statusCode = 400;
                throw error;
            }

            const inventoryResult = await client.query(
                `SELECT quantity
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id]
            );

            if (inventoryResult.rows.length === 0) {
                const error = new Error(
                    `Inventory not found for product ${item.product_id}.`
                );
                error.statusCode = 400;
                throw error;
            }

            const availableStock = Number(
                inventoryResult.rows[0].quantity
            );
            const quantity = Number(item.quantity);
            const price = Number(item.price);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                const error = new Error(
                    `Invalid quantity or price for product ${item.product_id}.`
                );
                error.statusCode = 400;
                throw error;
            }

            if (availableStock < quantity) {
                const error = new Error(
                    `Insufficient stock for product ${item.product_id}.`
                );
                error.statusCode = 400;
                throw error;
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
                shippingAddressId,
                billingAddressId,
            ]
        );

        const order = orderResult.rows[0];

        // Save item price snapshots and deduct inventory.
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

        // Clear the cart after successful checkout.
        await client.query(
            `DELETE FROM cart_items WHERE cart_id = $1`,
            [cartId]
        );

        await client.query(
            `UPDATE carts
             SET updated_at = NOW()
             WHERE id = $1`,
            [cartId]
        );

        await client.query("COMMIT");

        return { order, items: orderItems };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (id, profileId) => {
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
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];

        if (order.status !== "pending") {
            const error = new Error(
                "Only pending orders can be cancelled."
            );
            error.statusCode = 400;
            throw error;
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
             FROM order_items
             WHERE order_id = $1
             ORDER BY product_id`,
            [order.id]
        );

        // Restore stock reserved by this order.
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

        return updatedOrder.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};