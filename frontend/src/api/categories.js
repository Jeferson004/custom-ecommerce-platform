import { apiRequest } from "./client";

export const getCategories = () => {
    return apiRequest("/api/categories");
};