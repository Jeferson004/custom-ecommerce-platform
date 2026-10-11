import express from "express";

import {
    getInventory,
    getInventoryByProductId,
    createInventory,
    updateInventory
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getInventory);
router.get("/:productId", getInventoryByProductId);

router.post("/", createInventory);
router.put("/:productId", updateInventory);

export default router;