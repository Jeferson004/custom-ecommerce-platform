
import pool from "../configs/db.js";

// POST /api/payments
export const createPayment = async (req, res) => {
    const profileId = req.user.id;
    const { order_id, payment_method } = req.body;

    if (!order_id || !payment_method?.trim()) {
        return res.status(400).json({
            message: "Order ID and payment method are required.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify that the order belongs to the authenticated user.
        const orderResult = await client.query(
            `SELECT id, total_amount, status
             FROM orders
             WHERE id = $1 AND profile_id = $2
             FOR UPDATE`,
            [order_id, profileId]
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
                message: "Only pending orders can receive a payment record.",
            });
        }

        // Prevent a second payment record for the same order.
        const existingPayment = await client.query(
            `SELECT id
             FROM payments
             WHERE order_id = $1`,
            [order.id]
        );

        if (existingPayment.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "A payment record already exists for this order.",
            });
        }

        // Amount comes from the database, not the request body.
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
            [order.id, order.total_amount, payment_method.trim()]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Payment record created successfully.",
            payment: paymentResult.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create payment error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A payment record already exists for this order.",
            });
        }

        return res.status(500).json({
            message: "Failed to create payment record.",
        });
    } finally {
        client.release();
    }
};

// GET /api/payments
export const getPayments = async (req, res) => {
    try {
        const profileId = req.user.id;

        const result = await pool.query(
            `SELECT p.*
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE o.profile_id = $1
             ORDER BY p.created_at DESC`,
            [profileId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get payments error:", error);

        return res.status(500).json({
            message: "Failed to retrieve payments.",
        });
    }
};

// GET /api/payments/:id
export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const result = await pool.query(
            `SELECT p.*
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE p.id = $1
               AND o.profile_id = $2`,
            [id, profileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found.",
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Get payment error:", error);

        return res.status(500).json({
            message: "Failed to retrieve payment.",
        });
    }
};

// PATCH /api/payments/:id
// Allows changing the payment method only while payment is pending.
export const updatePayment = async (req, res) => {
    const { id } = req.params;
    const profileId = req.user.id;
    const { payment_method } = req.body;

    if (typeof payment_method !== "string" || !payment_method.trim()) {
        return res.status(400).json({
            message: "A valid payment method is required.",
        });
    }

    try {
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
            [payment_method.trim(), id, profileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Pending payment not found, or payment method cannot be changed.",
            });
        }

        return res.status(200).json({
            message: "Payment method updated successfully.",
            payment: result.rows[0],
        });
    } catch (error) {
        console.error("Update payment error:", error);

        return res.status(500).json({
            message: "Failed to update payment.",
        });
    }
};
