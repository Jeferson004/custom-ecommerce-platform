import { apiRequest } from "./client";

export const getProducts = () => {
    return apiRequest("/api/products");
};

export const getProductById = (id) => {
    return apiRequest(`/api/products/${id}`);
};

export const createProduct = (productData) => {
    return apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify(productData),
    });
};

export const updateProduct = (id, productData) => {
    return apiRequest(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(productData),
    });
};

export const deleteProduct = (id) => {
    return apiRequest(`/api/products/${id}`, {
        method: "DELETE",
    });
};
