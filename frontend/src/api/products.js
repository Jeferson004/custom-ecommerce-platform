import { apiRequest } from "./client";

export const getProducts = () => {
    return apiRequest("/api/products");
};

export const getProductById = (id) => {
    return apiRequest(`/api/products/${id}`);
};