import pool from '../configs/db.js';

// POST /api/payments
export const createPayment = async (profileId, orderId, paymentMethod) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify that the order belongs to the authenticated user.
        const orderResult = await client.query(
            `SELECT id, total_amount, status
             FROM orders
             WHERE id = $1 AND profile_id = $2
             FOR UPDATE`,
            [orderId, profileId],
        );

        if (orderResult.rows.length === 0) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            const error = new Error('Only pending orders can receive a payment record.');
            error.statusCode = 400;
            throw error;
        }

        // Prevent a second payment record for the same order.
        const existingPayment = await client.query(
            `SELECT id
             FROM payments
             WHERE order_id = $1`,
            [order.id],
        );

        if (existingPayment.rows.length > 0) {
            const error = new Error('A payment record already exists for this order.');
            error.statusCode = 409;
            throw error;
        }

        // The amount comes from the order, not the request body.
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
            [order.id, order.total_amount, paymentMethod],
        );

        await client.query('COMMIT');

        return paymentResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
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
        [profileId],
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
        [id, profileId],
    );

    return result.rows[0] || null;
};

// PATCH /api/payments/:id
// Change the payment method only while payment is pending.
export const updatePaymentMethod = async (id, profileId, paymentMethod) => {
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
        [paymentMethod, id, profileId],
    );

    return result.rows[0] || null;
};

// Find a payment belonging to an order and authenticated customer.
export const findPaymentByOrderId = async (orderId, profileId) => {
    const result = await pool.query(
        `SELECT p.*
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE p.order_id = $1
           AND o.profile_id = $2`,
        [orderId, profileId],
    );

    return result.rows[0] || null;
};

// Find the latest attempt that is still being created or is active.
export const findCurrentPaymentAttempt = async (paymentId) => {
    const result = await pool.query(
        `SELECT *
         FROM payment_attempts
         WHERE payment_id = $1
           AND status IN ('creating', 'active')
         ORDER BY attempt_number DESC
         LIMIT 1`,
        [paymentId],
    );

    return result.rows[0] || null;
};

// Create a new attempt, or return an existing current attempt.
// The payment row lock serializes attempt creation for the same payment.
export const createPaymentAttempt = async (paymentId, provider) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const paymentResult = await client.query(
            `SELECT id, amount, status
             FROM payments
             WHERE id = $1
             FOR UPDATE`,
            [paymentId],
        );

        if (paymentResult.rows.length === 0) {
            const error = new Error('Payment not found.');
            error.statusCode = 404;
            throw error;
        }

        const payment = paymentResult.rows[0];

        if (payment.status !== 'pending') {
            const error = new Error('Only pending payments can create checkout attempts.');
            error.statusCode = 400;
            throw error;
        }

        // Reuse an attempt that is already being created or is active.
        const currentAttemptResult = await client.query(
            `SELECT *
             FROM payment_attempts
             WHERE payment_id = $1
               AND status IN ('creating', 'active')
             ORDER BY attempt_number DESC
             LIMIT 1`,
            [paymentId],
        );

        if (currentAttemptResult.rows.length > 0) {
            await client.query('COMMIT');

            return {
                attempt: currentAttemptResult.rows[0],
                isNew: false,
            };
        }

        const numberResult = await client.query(
            `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt_number
             FROM payment_attempts
             WHERE payment_id = $1`,
            [paymentId],
        );

        const attemptNumber = numberResult.rows[0].next_attempt_number;

        const referenceId = `payment_${payment.id}_attempt_${attemptNumber}`;

        const attemptResult = await client.query(
            `INSERT INTO payment_attempts (
                payment_id,
                attempt_number,
                provider,
                reference_id,
                amount,
                currency,
                status,
                created_at,
                updated_at
             )
             VALUES ($1, $2, $3, $4, $5, 'PHP', 'creating', NOW(), NOW())
             RETURNING *`,
            [payment.id, attemptNumber, provider, referenceId, payment.amount],
        );

        await client.query('COMMIT');

        return {
            attempt: attemptResult.rows[0],
            isNew: true,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Save the provider's session details and activate the attempt.
export const activatePaymentAttempt = async (
    attemptId,
    providerReference,
    checkoutUrl,
    expiresAt = null,
) => {
    const result = await pool.query(
        `UPDATE payment_attempts
         SET provider_reference = $1,
             checkout_url = $2,
             expires_at = $3,
             status = 'active',
             updated_at = NOW()
         WHERE id = $4
           AND status = 'creating'
         RETURNING *`,
        [providerReference, checkoutUrl, expiresAt, attemptId],
    );

    return result.rows[0] || null;
};

// Find an attempt by its provider and provider-generated session ID.
export const findPaymentAttemptByProviderReference = async (provider, providerReference) => {
    const result = await pool.query(
        `SELECT
            pa.*,
            p.status AS payment_status,
            p.order_id,
            p.amount AS payment_amount,
            o.status AS order_status,
            o.total_amount AS order_total_amount
         FROM payment_attempts pa
         JOIN payments p ON p.id = pa.payment_id
         JOIN orders o ON o.id = p.order_id
         WHERE pa.provider = $1
           AND pa.provider_reference = $2`,
        [provider, providerReference],
    );

    return result.rows[0] || null;
};

export const expirePaymentAttempt = async (attemptId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const attemptResult = await client.query(
            `SELECT id, status
             FROM payment_attempts
             WHERE id = $1
             FOR UPDATE`,
            [attemptId],
        );

        if (attemptResult.rows.length === 0) {
            await client.query('COMMIT');
            return { result: 'not_found' };
        }

        const attempt = attemptResult.rows[0];

        // Do not overwrite a completed attempt.
        if (attempt.status === 'completed') {
            await client.query('COMMIT');
            return { result: 'already_completed' };
        }

        // Only active or creating attempts can be expired.
        if (!['active', 'creating'].includes(attempt.status)) {
            await client.query('COMMIT');
            return { result: 'already_processed' };
        }

        await client.query(
            `UPDATE payment_attempts
             SET status = 'expired',
                 updated_at = NOW()
             WHERE id = $1`,
            [attemptId],
        );

        await client.query('COMMIT');

        return { result: 'expired' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const completePaymentAttempt = async ({
    attemptId,
    providerPaymentId,
    referenceId,
    amount,
    currency,
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock the attempt and its parent payment.
        const result = await client.query(
            `SELECT
                pa.id AS attempt_id,
                pa.payment_id,
                pa.reference_id,
                pa.amount AS attempt_amount,
                pa.currency AS attempt_currency,
                pa.status AS attempt_status,
                pa.provider_payment_id,

                p.status AS payment_status,
                p.transaction_reference

             FROM payment_attempts pa
             JOIN payments p ON p.id = pa.payment_id
             WHERE pa.id = $1
             FOR UPDATE OF pa, p`,
            [attemptId],
        );

        if (result.rows.length === 0) {
            const error = new Error('Payment attempt not found.');
            error.statusCode = 404;
            throw error;
        }

        const attempt = result.rows[0];

        // Verify the provider's transaction against our records.
        const amountResult = await client.query(
            `SELECT
                $1::numeric = $2::numeric AS amount_matches`,
            [String(amount), String(attempt.attempt_amount)],
        );

        const amountMatches = amountResult.rows[0].amount_matches;

        if (
            attempt.reference_id !== referenceId ||
            !amountMatches ||
            attempt.attempt_currency !== currency
        ) {
            const error = new Error('Xendit payment details do not match the payment attempt.');

            error.statusCode = 400;
            throw error;
        }

        // Handle duplicate webhook delivery.
        if (attempt.attempt_status === 'completed') {
            if (attempt.provider_payment_id === providerPaymentId) {
                await client.query('COMMIT');
                return { result: 'already_completed' };
            }

            const error = new Error('The attempt is already associated with another provider payment.');

            error.statusCode = 409;
            throw error;
        }

        // Record the actual successful provider transaction.
        await client.query(
            `UPDATE payment_attempts
             SET status = 'completed',
                 provider_payment_id = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [providerPaymentId, attemptId],
        );

        // The parent payment must only be completed once.
        if (attempt.payment_status === 'pending') {
            await client.query(
                `UPDATE payments
                 SET status = 'completed',
                     transaction_reference = $1,
                     updated_at = NOW()
                 WHERE id = $2
                   AND status = 'pending'`,
                [providerPaymentId, attempt.payment_id],
            );

            await client.query('COMMIT');

            return { result: 'completed' };
        }

        // A different attempt may already have completed this payment.
        if (
            attempt.payment_status === 'completed' &&
            attempt.transaction_reference === providerPaymentId
        ) {
            await client.query('COMMIT');
            return { result: 'already_completed' };
        }

        // A different provider transaction succeeded for this payment.
        // Preserve the original payment record for manual reconciliation.
        await client.query('COMMIT');

        return { result: 'reconciliation_required' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
