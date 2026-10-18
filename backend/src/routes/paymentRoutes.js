import express from "express";
import {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
} from "../controllers/paymentController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authenticateUser);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.patch("/:id", updatePayment);

export default router;