import {
    findAllProducts,
    findProductById as findProductByIdModel,
    findCategoryById,
    createProduct as createProductModel,
    updateProduct as updateProductModel,
    deleteProduct as deleteProductModel,
} from "../models/productModel.js";

// Shared validation for create and update.
const validateProductData = (body) => {
    const {
        category_id,
        name,
        price,
    } = body;

    if (
        category_id === undefined ||
        category_id === null ||
        category_id === ""
    ) {
        return "Category is required.";
    }

    if (typeof name !== "string" || name.trim() === "") {
        return "Product name is required.";
    }

    if (price === undefined || price === null || price === "") {
        return "Product price is required.";
    }

    if (!Number.isFinite(Number(price))) {
        return "Product price must be a valid number.";
    }

    if (Number(price) < 0) {
        return "Product price cannot be negative.";
    }

    return null;
};

// GET /api/products
export const getProducts = async (req, res) => {
    try {
        const products = await findAllProducts();

        return res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Failed to retrieve products.",
        });
    }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await findProductByIdModel(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            message: "Failed to retrieve product.",
        });
    }
};

// POST /api/products
export const createProduct = async (req, res) => {
    const validationError = validateProductData(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError,
        });
    }

    try {
        const {
            category_id,
            name,
            description,
            price,
            sku,
            is_active,
        } = req.body;

        const category = await findCategoryById(category_id);

        if (!category) {
            return res.status(400).json({
                message: "Category does not exist.",
            });
        }

        const product = await createProductModel({
            category_id,
            name: name.trim(),
            description: description || null,
            price: Number(price),
            sku: sku || null,
            is_active: is_active ?? true,
        });

        return res.status(201).json(product);
    } catch (error) {
        console.error("Create product error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists.",
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Category does not exist.",
            });
        }

        return res.status(500).json({
            message: "Failed to create product.",
        });
    }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const validationError = validateProductData(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError,
        });
    }

    try {
        const {
            category_id,
            name,
            description,
            price,
            sku,
            is_active,
        } = req.body;

        const category = await findCategoryById(category_id);

        if (!category) {
            return res.status(400).json({
                message: "Category does not exist.",
            });
        }

        const product = await updateProductModel(id, {
            category_id,
            name: name.trim(),
            description: description || null,
            price: Number(price),
            sku: sku || null,
            is_active: is_active ?? true,
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error("Update product error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists.",
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Category does not exist.",
            });
        }

        return res.status(500).json({
            message: "Failed to update product.",
        });
    }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await deleteProductModel(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        return res.status(200).json({
            message: "Product deleted successfully.",
        });
    } catch (error) {
        console.error("Delete product error:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message:
                    "Product cannot be deleted because it is being used by another record.",
            });
        }

        return res.status(500).json({
            message: "Failed to delete product.",
        });
    }
};