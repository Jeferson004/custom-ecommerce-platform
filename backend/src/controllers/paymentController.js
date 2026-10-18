import {
    createPayment as createPaymentModel,
    findPaymentsByProfileId,
    findPaymentById,
    updatePaymentMethod,
} from "../models/paymentModel.js";

// POST /api/payments
export const createPayment = async (req, res) => {
    const profileId = req.user.id;
    const { order_id, payment_method } = req.body;

    if (
        order_id === undefined ||
        order_id === null ||
        order_id === "" ||
        typeof payment_method !== "string" ||
        !payment_method.trim()
    ) {
        return res.status(400).json({
            message: "Order ID and payment method are required.",
        });
    }

    try {
        const payment = await createPaymentModel(
            profileId,
            order_id,
            payment_method.trim()
        );

        return res.status(201).json({
            message: "Payment record created successfully.",
            payment,
        });
    } catch (error) {
        console.error("Create payment error:", error);

        if (error.statusCode === 404) {
            return res.status(404).json({
                message: error.message,
            });
        }

        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message,
            });
        }

        if (error.statusCode === 409 || error.code === "23505") {
            return res.status(409).json({
                message:
                    "A payment record already exists for this order.",
            });
        }

        return res.status(500).json({
            message: "Failed to create payment record.",
        });
    }
};

// GET /api/payments
export const getPayments = async (req, res) => {
    try {
        const payments = await findPaymentsByProfileId(req.user.id);

        return res.status(200).json(payments);
    } catch (error) {
        console.error("Get payments error:", error);

        return res.status(500).json({
            message: "Failed to retrieve payments.",
        });
    }
};

// GET /api/payments/:id
export const getPaymentById = async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await findPaymentById(id, req.user.id);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found.",
            });
        }

        return res.status(200).json(payment);
    } catch (error) {
        console.error("Get payment error:", error);

        return res.status(500).json({
            message: "Failed to retrieve payment.",
        });
    }
};

// PATCH /api/payments/:id
export const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { payment_method } = req.body;

    if (
        typeof payment_method !== "string" ||
        !payment_method.trim()
    ) {
        return res.status(400).json({
            message: "A valid payment method is required.",
        });
    }

    try {
        const payment = await updatePaymentMethod(
            id,
            req.user.id,
            payment_method.trim()
        );

        if (!payment) {
            return res.status(404).json({
                message:
                    "Pending payment not found, or payment method cannot be changed.",
            });
        }

        return res.status(200).json({
            message: "Payment method updated successfully.",
            payment,
        });
    } catch (error) {
        console.error("Update payment error:", error);

        return res.status(500).json({
            message: "Failed to update payment.",
        });
    }
};