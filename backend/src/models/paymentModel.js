import pool from "../configs/db.js";

// POST /api/payments
export const createPayment = async (
    profileId,
    orderId,
    paymentMethod
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify that the order belongs to the authenticated user.
        const orderResult = await client.query(
            `SELECT id, total_amount, status
             FROM orders
             WHERE id = $1 AND profile_id = $2
             FOR UPDATE`,
            [orderId, profileId]
        );

        if (orderResult.rows.length === 0) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];

        if (order.status !== "pending") {
            const error = new Error(
                "Only pending orders can receive a payment record."
            );
            error.statusCode = 400;
            throw error;
        }

        // Prevent a second payment record for the same order.
        const existingPayment = await client.query(
            `SELECT id
             FROM payments
             WHERE order_id = $1`,
            [order.id]
        );

        if (existingPayment.rows.length > 0) {
            const error = new Error(
                "A payment record already exists for this order."
            );
            error.statusCode = 409;
            throw error;
        }

        // The amount is retrieved from the order, not the request body.
        const paymentResult = await client.query(
            `INSERT INTO payments (
                order_id,
                amount,
                status,
                payment_method,
                created_at,
                updated_at
             )
             VALUES ($1, $2, 'pending', $3, NOW(), NOW())
             RETURNING *`,
            [order.id, order.total_amount, paymentMethod]
        );

        await client.query("COMMIT");

        return paymentResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// GET /api/payments
export const findPaymentsByProfileId = async (profileId) => {
    const result = await pool.query(
        `SELECT p.*
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE o.profile_id = $1
         ORDER BY p.created_at DESC`,
        [profileId]
    );

    return result.rows;
};

// GET /api/payments/:id
export const findPaymentById = async (id, profileId) => {
    const result = await pool.query(
        `SELECT p.*
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE p.id = $1
           AND o.profile_id = $2`,
        [id, profileId]
    );

    return result.rows[0] || null;
};

// PATCH /api/payments/:id
// Change the payment method only while payment is pending.
export const updatePaymentMethod = async (
    id,
    profileId,
    paymentMethod
) => {
    const result = await pool.query(
        `UPDATE payments p
         SET payment_method = $1,
             updated_at = NOW()
         FROM orders o
         WHERE p.order_id = o.id
           AND p.id = $2
           AND o.profile_id = $3
           AND p.status = 'pending'
         RETURNING p.*`,
        [paymentMethod, id, profileId]
    );

    return result.rows[0] || null;
};