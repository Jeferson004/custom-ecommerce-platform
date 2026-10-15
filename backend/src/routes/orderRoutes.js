import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
} from "../controllers/orderController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.patch("/:id/cancel", cancelOrder);

export default router;