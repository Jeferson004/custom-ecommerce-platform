import express from "express";
import {
    getInventory,
    getInventoryByProductId,
    getInventoryTransactions,
    createInventory,
    updateInventory,
} from "../controllers/inventoryController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Public routes: viewing inventory
router.get("/", getInventory);
// Inventory transaction history
router.get(
    "/transactions",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    getInventoryTransactions
);
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