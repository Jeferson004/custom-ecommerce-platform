import express from 'express';
import {
    getDashboardOverviewController,
    getRecentOrdersController,
    getLowStockProductsController,
    getSalesOverviewController,
} from '../controllers/dashboardController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();
router.use(authenticateUser);
router.use(authorizeRoles('staff', 'admin'));

router.get('/overview', getDashboardOverviewController);
router.get('/recent-orders', getRecentOrdersController);
router.get('/low-stock', getLowStockProductsController);
router.get('/sales-overview', getSalesOverviewController);

export default router;
