import { apiRequest } from "./client";

export const getCart = () => {
    return apiRequest("/api/cart");
};

export const addCartItem = (productId, quantity = 1) => {
    return apiRequest("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    });
};

export const updateCartItem = (productId, quantity) => {
    return apiRequest(`/api/cart/items/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
    });
};

export const removeCartItem = (productId) => {
    return apiRequest(`/api/cart/items/${productId}`, {
        method: "DELETE",
    });
};

export const clearCart = () => {
    return apiRequest("/api/cart/items", {
        method: "DELETE",
    });
};