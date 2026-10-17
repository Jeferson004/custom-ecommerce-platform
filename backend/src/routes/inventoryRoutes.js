import express from "express";
import {
    getInventory,
    getInventoryByProductId,
    createInventory,
    updateInventory
} from "../controllers/inventoryController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Public routes: viewing inventory
router.get("/", getInventory);
router.get("/:productId", getInventoryByProductId);

// Protected routes: staff and admin only
router.post(
    "/",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    createInventory
);

router.put(
    "/:productId",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    updateInventory
);

export default router;