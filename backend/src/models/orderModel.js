import pool from '../configs/db.js';

// GET /api/orders
export const findOrdersByProfileId = async (profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM orders
         WHERE profile_id = $1
         ORDER BY created_at DESC`,
        [profileId],
    );

    return result.rows;
};

// GET /api/orders/:id
export const findOrderById = async (id, profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM orders
         WHERE id = $1 AND profile_id = $2`,
        [id, profileId],
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
        [orderId],
    );

    return result.rows;
};

// POST /api/orders
export const createOrder = async (profileId, shippingAddressId, billingAddressId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify both addresses belong to this user.
        const addressResult = await client.query(
            `SELECT id
             FROM addresses
             WHERE profile_id = $1
               AND id = ANY($2::bigint[])`,
            [profileId, [shippingAddressId, billingAddressId]],
        );

        const foundAddressIds = new Set(addressResult.rows.map((address) => String(address.id)));

        if (
            !foundAddressIds.has(String(shippingAddressId)) ||
            !foundAddressIds.has(String(billingAddressId))
        ) {
            const error = new Error('One or both addresses are invalid.');
            error.statusCode = 400;
            throw error;
        }

        // Lock the user's cart during checkout.
        const cartResult = await client.query(
            `SELECT id
             FROM carts
             WHERE profile_id = $1
             FOR UPDATE`,
            [profileId],
        );

        if (cartResult.rows.length === 0) {
            const error = new Error('Your cart is empty.');
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
            [cartId],
        );

        if (itemsResult.rows.length === 0) {
            const error = new Error('Your cart is empty.');
            error.statusCode = 400;
            throw error;
        }

        // Lock inventory and validate every item before creating the order.
        const orderItems = [];
        let totalAmount = 0;

        for (const item of itemsResult.rows) {
            if (!item.is_active) {
                const error = new Error(
                    `Product ${item.product_id} is inactive and cannot be ordered.`,
                );
                error.statusCode = 400;
                throw error;
            }

            const inventoryResult = await client.query(
                `SELECT quantity
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id],
            );

            if (inventoryResult.rows.length === 0) {
                const error = new Error(`Inventory not found for product ${item.product_id}.`);
                error.statusCode = 400;
                throw error;
            }

            const availableStock = Number(inventoryResult.rows[0].quantity);
            const quantity = Number(item.quantity);
            const price = Number(item.price);

            if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(price) || price < 0) {
                const error = new Error(`Invalid quantity or price for product ${item.product_id}.`);
                error.statusCode = 400;
                throw error;
            }

            if (availableStock < quantity) {
                const error = new Error(`Insufficient stock for product ${item.product_id}.`);
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
                quantity_before: availableStock,
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
            [profileId, totalAmount, shippingAddressId, billingAddressId],
        );

        const order = orderResult.rows[0];

        await client.query(
            `INSERT INTO order_status_history (
                order_id,
                previous_status,
                new_status,
                changed_by,
                reason
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [order.id, null, 'pending', profileId, 'Order created.'],
        );

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
                [order.id, item.product_id, item.quantity, item.price, item.subtotal],
            );

            // Deduct inventory.
            const quantityAfter = item.quantity_before - item.quantity;

            const inventoryUpdateResult = await client.query(
                `UPDATE inventory
                SET quantity = $1,
                    updated_at = NOW()
                WHERE product_id = $2
                RETURNING product_id`,
                [quantityAfter, item.product_id],
            );

            if (inventoryUpdateResult.rows.length === 0) {
                throw new Error(`Inventory not found for product ${item.product_id}.`);
            }

            // Record inventory transaction.
            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id,
                    quantity_before,
                    quantity_change,
                    quantity_after,
                    reason,
                    reference_id
                )
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    item.product_id,
                    item.quantity_before,
                    -item.quantity,
                    quantityAfter,
                    'sale',
                    order.id,
                ],
            );
        }

        // Clear the cart after successful checkout.
        await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

        await client.query(
            `UPDATE carts
             SET updated_at = NOW()
             WHERE id = $1`,
            [cartId],
        );

        await client.query('COMMIT');

        return { order, items: orderItems };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (id, profileId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `SELECT id, status
             FROM orders
             WHERE id = $1 AND profile_id = $2
             FOR UPDATE`,
            [id, profileId],
        );

        if (orderResult.rows.length === 0) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            const error = new Error('Only pending orders can be cancelled.');
            error.statusCode = 400;
            throw error;
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
             FROM order_items
             WHERE order_id = $1
             ORDER BY product_id`,
            [order.id],
        );

        // Restore stock reserved by this order.
        for (const item of itemsResult.rows) {
            // Get the current inventory and lock the row.
            const inventoryResult = await client.query(
                `SELECT quantity
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id],
            );

            if (inventoryResult.rows.length === 0) {
                throw new Error(`Inventory not found for product ${item.product_id}.`);
            }

            // Get the current stock.
            const quantityBefore = Number(inventoryResult.rows[0].quantity);

            // Calculate the restored stock.
            const quantityChange = Number(item.quantity);
            const quantityAfter = quantityBefore + quantityChange;

            // Restore inventory.
            const inventoryUpdateResult = await client.query(
                `UPDATE inventory
                 SET quantity = $1,
                     updated_at = NOW()
                 WHERE product_id = $2
                 RETURNING product_id`,
                [quantityAfter, item.product_id],
            );

            if (inventoryUpdateResult.rows.length === 0) {
                throw new Error(`Failed to restore inventory for product ${item.product_id}.`);
            }

            // Record inventory transaction.
            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id,
                    quantity_before,
                    quantity_change,
                    quantity_after,
                    reason,
                    reference_id
                )
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    item.product_id,
                    quantityBefore,
                    quantityChange,
                    quantityAfter,
                    'cancellation',
                    order.id,
                ],
            );
        }

        const updatedOrder = await client.query(
            `UPDATE orders
             SET status = 'cancelled',
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [order.id],
        );

        await client.query(
            `INSERT INTO order_status_history (
                order_id,
                previous_status,
                new_status,
                changed_by,
                reason
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [order.id, order.status, 'cancelled', profileId, 'Cancelled by customer.'],
        );

        await client.query('COMMIT');

        return updatedOrder.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * ADMIN: Retrieve all orders.
 */
export const findAllOrders = async () => {
    const result = await pool.query(
        `SELECT
            o.id,
            o.profile_id,
            p.name AS customer_name,
            o.status,
            o.total_amount,
            o.created_at,
            o.updated_at
         FROM orders o
         JOIN profiles p ON p.id = o.profile_id
         ORDER BY o.created_at DESC`,
    );

    return result.rows;
};

/**
 * ADMIN: Retrieve an order by ID.
 */
export const findAdminOrderById = async (orderId) => {
    const result = await pool.query(
        `SELECT
            o.*,
            p.name AS customer_name
         FROM orders o
         JOIN profiles p ON p.id = o.profile_id
         WHERE o.id = $1`,
        [orderId],
    );

    return result.rows[0] || null;
};

/**
 * ADMIN: Retrieve order status history.
 */
export const findOrderStatusHistory = async (orderId) => {
    const result = await pool.query(
        `SELECT
            h.id,
            h.order_id,
            h.previous_status,
            h.new_status,
            h.reason,
            h.created_at,
            h.changed_by,
            p.name AS changed_by_name
         FROM order_status_history h
         JOIN profiles p ON p.id = h.changed_by
         WHERE h.order_id = $1
         ORDER BY h.created_at DESC, h.id DESC`,
        [orderId],
    );

    return result.rows;
};

/**
 * ADMIN: Update order status.
 */
export const updateOrderStatus = async (orderId, newStatus, changedBy, reason = null) => {
    const allowedTransitions = {
        pending: ['confirmed'],
        confirmed: ['processing'],
        processing: ['shipped'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
    };

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `SELECT id, status
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [orderId],
        );

        if (orderResult.rows.length === 0) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];

        if (!allowedTransitions[order.status]?.includes(newStatus)) {
            const error = new Error(`Cannot change order status from ${order.status} to ${newStatus}.`);
            error.statusCode = 400;
            throw error;
        }

        const updatedOrderResult = await client.query(
            `UPDATE orders
             SET status = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newStatus, order.id],
        );

        await client.query(
            `INSERT INTO order_status_history (
                order_id,
                previous_status,
                new_status,
                changed_by,
                reason
             )
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, order.status, newStatus, changedBy, reason],
        );

        await client.query('COMMIT');

        return updatedOrderResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * ADMIN: Cancel an order and restore inventory.
 */
export const cancelAdminOrder = async (orderId, changedBy, reason) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `SELECT id, status
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [orderId],
        );

        if (orderResult.rows.length === 0) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];
        const cancellableStatuses = ['pending', 'confirmed', 'processing'];

        if (!cancellableStatuses.includes(order.status)) {
            const error = new Error(`Orders in ${order.status} status cannot be cancelled.`);
            error.statusCode = 400;
            throw error;
        }

        if (!reason || !reason.trim()) {
            const error = new Error('A cancellation reason is required.');
            error.statusCode = 400;
            throw error;
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
             FROM order_items
             WHERE order_id = $1
             ORDER BY product_id`,
            [order.id],
        );

        // Restore inventory and record each stock transaction.
        for (const item of itemsResult.rows) {
            const inventoryResult = await client.query(
                `SELECT quantity
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id],
            );

            if (inventoryResult.rows.length === 0) {
                throw new Error(`Inventory not found for product ${item.product_id}.`);
            }

            const quantityBefore = Number(inventoryResult.rows[0].quantity);
            const quantityChange = Number(item.quantity);
            const quantityAfter = quantityBefore + quantityChange;

            await client.query(
                `UPDATE inventory
                 SET quantity = $1,
                     updated_at = NOW()
                 WHERE product_id = $2`,
                [quantityAfter, item.product_id],
            );

            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id,
                    quantity_before,
                    quantity_change,
                    quantity_after,
                    reason,
                    reference_id,
                    adjusted_by
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    item.product_id,
                    quantityBefore,
                    quantityChange,
                    quantityAfter,
                    'cancellation',
                    order.id,
                    changedBy,
                ],
            );
        }

        const updatedOrderResult = await client.query(
            `UPDATE orders
             SET status = 'cancelled',
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [order.id],
        );

        // Record cancellation in the order audit history.
        await client.query(
            `INSERT INTO order_status_history (
                order_id,
                previous_status,
                new_status,
                changed_by,
                reason
             )
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, order.status, 'cancelled', changedBy, reason.trim()],
        );

        await client.query('COMMIT');

        return updatedOrderResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
