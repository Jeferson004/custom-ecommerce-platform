import test from 'node:test';
import assert from 'node:assert/strict';

import { handleXenditWebhook } from '../controllers/paymentWebhookController.js';

// Use an existing Payment Session and attempt from your test database.
const webhookPayload = {
    event: 'payment_session.completed',
    data: {
        payment_session_id: 'ps-6b06d447659503849ff8deef',
        reference_id: 'payment_11_attempt_1',
        payment_id: 'py-28ce7562-8b10-4852-9a2c-20c4cbc864ab',
        session_type: 'PAY',
        status: 'COMPLETED',
        amount: 499.99,
        currency: 'PHP',
    },
};

// Simulate Express request and response objects.
const createMockResponse = () => {
    const res = {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        },
    };

    return res;
};

test('rejects an underlying Xendit payment that is not SUCCEEDED', async (t) => {
    process.env.XENDIT_WEBHOOK_TOKEN = 'test-webhook-token';

    // Simulate an unsuccessful response from Xendit's Payments API.
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        assert.match(String(url), /\/v3\/payments\//, 'Expected a request to the Xendit Payments API');

        assert.equal(options.method, 'GET');

        return new Response(
            JSON.stringify({
                payment_id: webhookPayload.data.payment_id,
                reference_id: webhookPayload.data.reference_id,
                status: 'FAILED',
                request_amount: webhookPayload.data.amount,
                currency: webhookPayload.data.currency,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    const req = {
        body: webhookPayload,

        get(headerName) {
            if (headerName.toLowerCase() === 'x-callback-token') {
                return 'test-webhook-token';
            }

            return undefined;
        },
    };

    const res = createMockResponse();

    await handleXenditWebhook(req, res);

    assert.equal(res.statusCode, 409);

    assert.deepEqual(res.body, {
        message: 'Underlying Xendit payment could not be verified.',
    });
});
