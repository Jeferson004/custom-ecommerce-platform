import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../models/productModel.js";

export const getProducts = async (req, res) => {
    try {
        const products = await getAllProducts();

        res.status(200).json(products);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
};

export const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await getProductById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
};

export const addProduct = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                message: "Name and price are required"
            });
        }

        const image = req.file
            ? req.file.filename
            : null;

        const productId = await createProduct(
            name,
            price,
            image
        );

        const product = await getProductById(productId);

        res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create product"
        });
    }
};

export const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const existingProduct = await getProductById(id);

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const image = req.file
            ? req.file.filename
            : existingProduct.image;

        await updateProduct(
            id,
            name,
            price,
            image
        );

        const updatedProduct = await getProductById(id);

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update product"
        });
    }
};

export const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const existingProduct = await getProductById(id);

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        await deleteProduct(id);

        res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete product"
        });
    }
};