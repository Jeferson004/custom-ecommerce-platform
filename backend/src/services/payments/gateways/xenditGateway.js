const XENDIT_API_URL = 'https://api.xendit.co';

const getAuthorizationHeader = () => {
    const secretKey = process.env.XENDIT_SECRET_KEY;

    if (!secretKey) {
        throw new Error('Xendit secret API key is not configured.');
    }

    const encodedCredentials = Buffer.from(`${secretKey}:`).toString('base64');

    return `Basic ${encodedCredentials}`;
};

// POST /sessions
export const createPaymentSession = async ({
    referenceId,
    amount,
    description,
    successReturnUrl,
    cancelReturnUrl,
}) => {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        throw new Error('A valid payment amount is required.');
    }

    const payload = {
        reference_id: referenceId,
        session_type: 'PAY',
        mode: 'PAYMENT_LINK',
        amount: Number(amount),
        currency: 'PHP',
        country: 'PH',
        description,
        ...(successReturnUrl && {
            success_return_url: successReturnUrl,
        }),
        ...(cancelReturnUrl && {
            cancel_return_url: cancelReturnUrl,
        }),
    };

    const response = await fetch(`${XENDIT_API_URL}/sessions`, {
        method: 'POST',
        headers: {
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('Xendit API error:', data);

        const error = new Error(data.message || 'Failed to create Xendit payment session.');

        error.statusCode = response.status;

        throw error;
    }

    if (!data.payment_session_id || !data.payment_link_url) {
        throw new Error('Invalid Xendit payment session response.');
    }

    return {
        paymentSessionId: data.payment_session_id,
        checkoutUrl: data.payment_link_url,
        referenceId: data.reference_id,
        status: data.status,
        expiresAt: data.expires_at || null,
    };
};

// GET /v3/payments/:paymentId
export const retrievePayment = async (paymentId) => {
    if (!paymentId || typeof paymentId !== 'string') {
        throw new Error('A valid Xendit payment ID is required.');
    }

    const response = await fetch(`${XENDIT_API_URL}/v3/payments/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: {
            Authorization: getAuthorizationHeader(),
            'api-version': '2024-11-11',
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('Xendit payment retrieval error:', data);

        const error = new Error(data.message || 'Failed to retrieve Xendit payment.');

        error.statusCode = response.status;

        throw error;
    }

    if (!data.payment_id || !data.status) {
        throw new Error('Invalid Xendit payment response.');
    }

    return {
        paymentId: data.payment_id,
        referenceId: data.reference_id,
        status: data.status,
        amount: data.request_amount,
        currency: data.currency,
    };
};
