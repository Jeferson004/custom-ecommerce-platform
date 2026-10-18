import {
    findAllInventory,
    findInventoryByProductId,
    findProductById,
    findInventoryRecordByProductId,
    createInventory as createInventoryModel,
    updateInventory as updateInventoryModel,
} from "../models/inventoryModel.js";

// GET /api/inventory
export const getInventory = async (req, res) => {
    try {
        const inventory = await findAllInventory();

        return res.status(200).json(inventory);
    } catch (error) {
        console.error("Get inventory error:", error);

        return res.status(500).json({
            message: "Failed to retrieve inventory.",
        });
    }
};

// GET /api/inventory/:productId
export const getInventoryByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        const inventory = await findInventoryByProductId(productId);

        if (!inventory) {
            return res.status(404).json({
                message: "Inventory record not found.",
            });
        }

        return res.status(200).json(inventory);
    } catch (error) {
        console.error("Get inventory by product ID error:", error);

        return res.status(500).json({
            message: "Failed to retrieve inventory.",
        });
    }
};

// POST /api/inventory
export const createInventory = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (
            product_id === undefined ||
            product_id === null ||
            product_id === ""
        ) {
            return res.status(400).json({
                message: "Product ID is required.",
            });
        }

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === ""
        ) {
            return res.status(400).json({
                message: "Quantity is required.",
            });
        }

        if (
            !Number.isInteger(Number(quantity)) ||
            !Number.isFinite(Number(quantity))
        ) {
            return res.status(400).json({
                message: "Quantity must be an integer.",
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message: "Quantity cannot be negative.",
            });
        }

        const product = await findProductById(product_id);

        if (!product) {
            return res.status(400).json({
                message: "Product does not exist.",
            });
        }

        const existingInventory =
            await findInventoryRecordByProductId(product_id);

        if (existingInventory) {
            return res.status(409).json({
                message: "Inventory already exists for this product.",
            });
        }

        const inventory = await createInventoryModel(
            product_id,
            Number(quantity)
        );

        return res.status(201).json(inventory);
    } catch (error) {
        console.error("Create inventory error:", error);

        return res.status(500).json({
            message: "Failed to create inventory.",
        });
    }
};

// PUT /api/inventory/:productId
export const updateInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === ""
        ) {
            return res.status(400).json({
                message: "Quantity is required.",
            });
        }

        if (
            !Number.isInteger(Number(quantity)) ||
            !Number.isFinite(Number(quantity))
        ) {
            return res.status(400).json({
                message: "Quantity must be an integer.",
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message: "Quantity cannot be negative.",
            });
        }

        const inventory = await updateInventoryModel(
            productId,
            Number(quantity)
        );

        if (!inventory) {
            return res.status(404).json({
                message: "Inventory record not found.",
            });
        }

        return res.status(200).json(inventory);
    } catch (error) {
        console.error("Update inventory error:", error);

        return res.status(500).json({
            message: "Failed to update inventory.",
        });
    }
};