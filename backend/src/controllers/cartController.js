import {
    getCartByProfileId,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCartByProfileId,
} from "../models/cartModel.js";

// GET /api/cart
export const getCart = async (req, res) => {
    try {
        const profileId = req.user.id;

        const cartData = await getCartByProfileId(profileId);

        return res.status(200).json(cartData);
    } catch (error) {
        console.error("Get cart error:", error);

        return res.status(500).json({
            message: "Failed to retrieve cart.",
        });
    }
};

// POST /api/cart/items
export const addCartItem = async (req, res) => {
    const { product_id, quantity = 1 } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            message: "Quantity must be a positive integer.",
        });
    }

    try {
        const profileId = req.user.id;

        const item = await addItemToCart(
            profileId,
            product_id,
            quantity
        );

        return res.status(201).json({
            message: "Product added to cart successfully.",
            item,
        });
    } catch (error) {
        console.error("Add cart item error:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to add product to cart.",
        });
    }
};

// PUT /api/cart/items/:productId
export const updateCartItem = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            message: "Quantity must be a positive integer.",
        });
    }

    try {
        const profileId = req.user.id;

        const item = await updateCartItemQuantity(
            profileId,
            productId,
            quantity
        );

        if (!item) {
            return res.status(404).json({
                message:
                    "Cart item not found, product inactive, or insufficient stock.",
            });
        }

        return res.status(200).json({
            message: "Cart item quantity updated successfully.",
            item,
        });
    } catch (error) {
        console.error("Update cart item error:", error);

        return res.status(500).json({
            message: "Failed to update cart item.",
        });
    }
};

// DELETE /api/cart/items/:productId
export const removeCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const profileId = req.user.id;

        const deletedItem = await removeItemFromCart(
            profileId,
            productId
        );

        if (!deletedItem) {
            return res.status(404).json({
                message: "Cart item not found.",
            });
        }

        return res.status(200).json({
            message: "Product removed from cart successfully.",
        });
    } catch (error) {
        console.error("Remove cart item error:", error);

        return res.status(500).json({
            message: "Failed to remove cart item.",
        });
    }
};

// DELETE /api/cart/items
export const clearCart = async (req, res) => {
    try {
        const profileId = req.user.id;

        await clearCartByProfileId(profileId);

        return res.status(200).json({
            message: "Cart cleared successfully.",
        });
    } catch (error) {
        console.error("Clear cart error:", error);

        return res.status(500).json({
            message: "Failed to clear cart.",
        });
    }
};