import express from "express";
import {
    getDashboardOverviewController,
    getRecentOrdersController
} from "../controllers/dashboardController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles("staff", "admin"));

router.get("/overview", getDashboardOverviewController);
router.get("/recent-orders", getRecentOrdersController);

export default router;