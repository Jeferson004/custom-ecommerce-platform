import {
    findOrdersByProfileId,
    findOrderById as findOrderByIdModel,
    findOrderItemsByOrderId,
    createOrder as createOrderModel,
    cancelOrder as cancelOrderModel,
    findAllOrders,
    findAdminOrderById,
    findOrderStatusHistory,
    updateOrderStatus,
    cancelAdminOrder as cancelAdminOrderModel,
} from '../models/orderModel.js';

// Validate PostgreSQL BIGINT order IDs.
const isValidOrderId = (id) => /^[1-9]\d*$/.test(id);

// POST /api/orders
export const createOrder = async (req, res) => {
    const profileId = req.user.id;
    const { shipping_address_id, billing_address_id } = req.body ?? {};

    if (
        shipping_address_id === undefined ||
        shipping_address_id === null ||
        shipping_address_id === '' ||
        billing_address_id === undefined ||
        billing_address_id === null ||
        billing_address_id === ''
    ) {
        return res.status(400).json({
            message: 'Shipping and billing addresses are required.',
        });
    }

    try {
        const result = await createOrderModel(profileId, shipping_address_id, billing_address_id);

        return res.status(201).json({
            message: 'Order created successfully.',
            order: result.order,
            items: result.items,
        });
    } catch (error) {
        console.error('Create order error:', error);

        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to create order.',
        });
    }
};

// GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const orders = await findOrdersByProfileId(req.user.id);

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Get orders error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve orders.',
        });
    }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
    const { id } = req.params;

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    try {
        const order = await findOrderByIdModel(id, req.user.id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found.',
            });
        }

        const items = await findOrderItemsByOrderId(order.id);

        return res.status(200).json({
            order,
            items,
        });
    } catch (error) {
        console.error('Get order error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve order.',
        });
    }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
    const { id } = req.params;

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    try {
        const order = await cancelOrderModel(id, req.user.id);

        return res.status(200).json({
            message: 'Order cancelled successfully.',
            order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);

        if (error.statusCode === 404 || error.statusCode === 400) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to cancel order.',
        });
    }
};

// =====================================================
// ADMIN ORDER CONTROLLERS
// =====================================================

// GET /api/orders/admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await findAllOrders();

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve orders.',
        });
    }
};

// GET /api/orders/admin/:id
export const getAdminOrderById = async (req, res) => {
    const { id } = req.params;

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    try {
        const order = await findAdminOrderById(id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found.',
            });
        }

        const items = await findOrderItemsByOrderId(order.id);

        return res.status(200).json({
            order,
            items,
        });
    } catch (error) {
        console.error('Get admin order error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve order.',
        });
    }
};

// PATCH /api/orders/admin/:id/status
export const updateAdminOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reason = null } = req.body ?? {};

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (typeof status !== 'string' || !validStatuses.includes(status)) {
        return res.status(400).json({
            message: 'Invalid order status.',
        });
    }

    if (status === 'cancelled') {
        return res.status(400).json({
            message: 'Use the administrative cancellation endpoint to cancel orders.',
        });
    }

    if (reason !== null && typeof reason !== 'string') {
        return res.status(400).json({
            message: 'Reason must be a string.',
        });
    }

    try {
        const order = await updateOrderStatus(id, status, req.user.id, reason);

        return res.status(200).json({
            message: 'Order status updated successfully.',
            order,
        });
    } catch (error) {
        console.error('Update admin order status error:', error);

        if (error.statusCode === 404 || error.statusCode === 400) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to update order status.',
        });
    }
};

// PATCH /api/orders/admin/:id/cancel
export const cancelAdminOrder = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body ?? {};

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    if (typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({
            message: 'A cancellation reason is required.',
        });
    }

    try {
        const order = await cancelAdminOrderModel(id, req.user.id, reason.trim());

        return res.status(200).json({
            message: 'Order cancelled successfully.',
            order,
        });
    } catch (error) {
        console.error('Admin cancel order error:', error);

        if (error.statusCode === 404 || error.statusCode === 400) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to cancel order.',
        });
    }
};

// GET /api/orders/admin/:id/history
export const getOrderStatusHistory = async (req, res) => {
    const { id } = req.params;

    if (!isValidOrderId(id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        });
    }

    try {
        // Verify that the order exists first.
        const order = await findAdminOrderById(id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found.',
            });
        }

        const history = await findOrderStatusHistory(order.id);

        return res.status(200).json(history);
    } catch (error) {
        console.error('Get order status history error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve order status history.',
        });
    }
};
