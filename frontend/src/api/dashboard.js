
import { apiRequest } from "./client";

export const getDashboardOverview = async () => {
    return apiRequest("/api/dashboard/overview");
};

export const getRecentOrders = async () => {
    return apiRequest("/api/dashboard/recent-orders");
};

export const getLowStockProducts = async () => {
    return apiRequest("/api/dashboard/low-stock");
};

export const getSalesOverview = async () => {
    return apiRequest("/api/dashboard/sales-overview");
};
