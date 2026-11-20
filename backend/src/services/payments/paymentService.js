import {
    createPayment,
    findPaymentByOrderId,
    createPaymentAttempt,
    activatePaymentAttempt,
} from '../../models/paymentModel.js';

import { createPaymentSession } from './gateways/xenditGateway.js';

export const createPaymentCheckout = async (profileId, orderId, paymentMethod) => {
    let payment = await findPaymentByOrderId(orderId, profileId);

    // Create a payment record if one does not exist.
    if (!payment) {
        try {
            payment = await createPayment(profileId, orderId, paymentMethod);
        } catch (error) {
            // Another request may have created the payment first.
            if (error.statusCode !== 409 && error.code !== '23505') {
                throw error;
            }

            payment = await findPaymentByOrderId(orderId, profileId);

            if (!payment) {
                throw error;
            }
        }
    }

    if (payment.status !== 'pending') {
        const error = new Error('Only pending payments can create a checkout session.');
        error.statusCode = 400;
        throw error;
    }

    // Create or retrieve the current payment attempt.
    const { attempt, isNew } = await createPaymentAttempt(payment.id, 'xendit');

    // Another request may already be creating this attempt.
    if (!isNew && attempt.status === 'creating') {
        const error = new Error('A checkout session is currently being created.');
        error.statusCode = 409;
        throw error;
    }

    // Reuse an existing active checkout session.
    if (!isNew && attempt.status === 'active') {
        return {
            ...payment,
            checkout_url: attempt.checkout_url,
            payment_attempt: attempt,
        };
    }

    // Create a new Xendit Payment Session for this attempt.
    const session = await createPaymentSession({
        referenceId: attempt.reference_id,
        amount: attempt.amount,
        description: `Payment for order #${payment.order_id}`,
    });

    // Save the Xendit session details against the attempt.
    const updatedAttempt = await activatePaymentAttempt(
        attempt.id,
        session.paymentSessionId,
        session.checkoutUrl,
        session.expiresAt,
    );

    if (!updatedAttempt) {
        throw new Error(
            'Xendit session was created, but attempt details could not be saved. Manual reconciliation is required.',
        );
    }

    return {
        ...payment,
        checkout_url: updatedAttempt.checkout_url,
        payment_attempt: updatedAttempt,
    };
};
