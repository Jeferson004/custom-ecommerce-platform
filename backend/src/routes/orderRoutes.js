import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    getAdminOrderById,
    updateAdminOrderStatus,
    cancelAdminOrder,
    getOrderStatusHistory,
} from '../controllers/orderController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

// All order endpoints require authentication.
router.use(authenticateUser);

// =====================================================
// ADMIN ROUTES
// =====================================================
router.use('/admin', authorizeRoles('staff', 'admin'));
router.get('/admin', getAllOrders);
router.get('/admin/:id/history', getOrderStatusHistory);
router.get('/admin/:id', getAdminOrderById);
router.patch('/admin/:id/status', updateAdminOrderStatus);
router.patch('/admin/:id/cancel', cancelAdminOrder);

// =====================================================
// CUSTOMER ROUTES
// =====================================================
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

export default router;
