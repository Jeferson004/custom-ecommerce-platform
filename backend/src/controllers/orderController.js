import {
    findOrdersByProfileId,
    findOrderById as findOrderByIdModel,
    findOrderItemsByOrderId,
    createOrder as createOrderModel,
    cancelOrder as cancelOrderModel,
} from "../models/orderModel.js";

// POST /api/orders
export const createOrder = async (req, res) => {
    const profileId = req.user.id;
    const { shipping_address_id, billing_address_id } = req.body;

    if (
        shipping_address_id === undefined ||
        shipping_address_id === null ||
        shipping_address_id === "" ||
        billing_address_id === undefined ||
        billing_address_id === null ||
        billing_address_id === ""
    ) {
        return res.status(400).json({
            message: "Shipping and billing addresses are required.",
        });
    }

    try {
        const result = await createOrderModel(
            profileId,
            shipping_address_id,
            billing_address_id
        );

        return res.status(201).json({
            message: "Order created successfully.",
            order: result.order,
            items: result.items,
        });
    } catch (error) {
        console.error("Create order error:", error);

        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create order.",
        });
    }
};

// GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const orders = await findOrdersByProfileId(req.user.id);

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            message: "Failed to retrieve orders.",
        });
    }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await findOrderByIdModel(id, req.user.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found.",
            });
        }

        const items = await findOrderItemsByOrderId(order.id);

        return res.status(200).json({
            order,
            items,
        });
    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            message: "Failed to retrieve order.",
        });
    }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await cancelOrderModel(id, req.user.id);

        return res.status(200).json({
            message: "Order cancelled successfully.",
            order,
        });
    } catch (error) {
        console.error("Cancel order error:", error);

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

        return res.status(500).json({
            message: "Failed to cancel order.",
        });
    }
};