import { timingSafeEqual } from 'node:crypto';

import {
    findPaymentAttemptByProviderReference,
    expirePaymentAttempt,
    completePaymentAttempt,
} from '../models/paymentModel.js';

import { retrievePayment } from '../services/payments/gateways/xenditGateway.js';

const verifyWebhookToken = (receivedToken, expectedToken) => {
    if (!receivedToken || !expectedToken) {
        return false;
    }

    const received = Buffer.from(receivedToken);
    const expected = Buffer.from(expectedToken);

    if (received.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(received, expected);
};

// Compare PHP amounts without relying on floating-point equality.
const toMinorUnits = (amount) => {
    const value = String(amount);

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return null;
    }

    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const amountsMatch = (first, second) => {
    const firstAmount = toMinorUnits(first);
    const secondAmount = toMinorUnits(second);

    return firstAmount !== null && secondAmount !== null && firstAmount === secondAmount;
};

export const handleXenditWebhook = async (req, res) => {
    const receivedToken = req.get('x-callback-token');
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    // Verify server configuration.
    if (!expectedToken) {
        console.error('Xendit webhook verification token is not configured.');

        return res.status(500).json({
            message: 'Webhook configuration error.',
        });
    }

    // Authenticate the webhook sender.
    if (!verifyWebhookToken(receivedToken, expectedToken)) {
        return res.status(401).json({
            message: 'Invalid webhook verification token.',
        });
    }

    const { event, data } = req.body ?? {};

    if (!event || !data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({
            message: 'Invalid webhook payload.',
        });
    }

    const expectedEvents = {
        'payment_session.completed': 'COMPLETED',
        'payment_session.expired': 'EXPIRED',
    };

    if (!Object.hasOwn(expectedEvents, event)) {
        return res.status(200).json({
            message: 'Unsupported event ignored.',
        });
    }

    // Validate common Payment Session fields.
    if (
        typeof data.payment_session_id !== 'string' ||
        !data.payment_session_id.trim() ||
        typeof data.reference_id !== 'string' ||
        !data.reference_id.trim() ||
        data.session_type !== 'PAY' ||
        data.status !== expectedEvents[event] ||
        data.currency !== 'PHP' ||
        toMinorUnits(data.amount) === null ||
        toMinorUnits(data.amount) <= 0n
    ) {
        return res.status(400).json({
            message: 'Invalid Payment Session data.',
        });
    }

    try {
        // Find the attempt using the Xendit Payment Session ID.
        const attempt = await findPaymentAttemptByProviderReference('xendit', data.payment_session_id);

        // The session may have been created before its ID was saved.
        // Return a retryable response rather than losing the notification.
        if (!attempt) {
            console.error(
                'Xendit webhook received for an unknown Payment Session:',
                data.payment_session_id,
            );

            return res.status(503).json({
                message: 'Payment attempt is not available yet. Retry later.',
            });
        }

        // Verify the merchant reference.
        if (attempt.reference_id !== data.reference_id) {
            console.error('Xendit webhook reference ID mismatch.');

            return res.status(400).json({
                message: 'Payment reference does not match.',
            });
        }

        // Verify the webhook amount against our stored attempt.
        if (!amountsMatch(data.amount, attempt.amount) || data.currency !== attempt.currency) {
            console.error('Xendit webhook amount or currency mismatch.');

            return res.status(400).json({
                message: 'Payment amount or currency does not match.',
            });
        }

        // Handle expired checkout sessions.
        if (event === 'payment_session.expired') {
            const result = await expirePaymentAttempt(attempt.id);

            return res.status(200).json({
                message: 'Payment Session expiration processed.',
                result: result.result,
            });
        }

        // A completed Payment Session must include its underlying Payment ID.
        if (typeof data.payment_id !== 'string' || !data.payment_id.trim()) {
            return res.status(400).json({
                message: 'Payment ID is missing from the completed session.',
            });
        }

        // Retrieve the actual Xendit Payment transaction.
        const providerPayment = await retrievePayment(data.payment_id);

        // Verify the retrieved Payment against the webhook and our attempt.
        if (
            providerPayment.paymentId !== data.payment_id ||
            providerPayment.referenceId !== attempt.reference_id ||
            providerPayment.status !== 'SUCCEEDED' ||
            providerPayment.currency !== attempt.currency ||
            !amountsMatch(providerPayment.amount, data.amount)
        ) {
            console.error('Xendit Payment verification failed:', data.payment_session_id);

            return res.status(409).json({
                message: 'Underlying Xendit payment could not be verified.',
            });
        }

        // Complete the attempt and parent payment in one transaction.
        const result = await completePaymentAttempt({
            attemptId: attempt.id,
            providerPaymentId: providerPayment.paymentId,
            referenceId: providerPayment.referenceId,
            amount: providerPayment.amount,
            currency: providerPayment.currency,
        });

        if (result.result === 'reconciliation_required') {
            console.error(
                'A second successful Xendit transaction requires reconciliation:',
                providerPayment.paymentId,
            );
        }

        return res.status(200).json({
            message: 'Payment Session completion processed.',
            result: result.result,
        });
    } catch (error) {
        console.error('Xendit webhook processing error:', error);

        return res.status(500).json({
            message: 'Unable to process Xendit webhook.',
        });
    }
};
