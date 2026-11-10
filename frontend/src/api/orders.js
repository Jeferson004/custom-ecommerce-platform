
import { apiRequest } from "./client";

// CUSTOMER ORDER API
export const getOrders = () =>
    apiRequest("/api/orders");

export const getOrderById = (id) =>
    apiRequest(`/api/orders/${id}`);

export const createOrder = (shippingAddressId, billingAddressId) =>
    apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
            shipping_address_id: shippingAddressId,
            billing_address_id: billingAddressId,
        }),
    });

export const cancelOrder = (id) =>
    apiRequest(`/api/orders/${id}/cancel`, {
        method: "PATCH",
    });

// ADMIN ORDER API
export const getAllOrders = () =>
    apiRequest("/api/orders/admin");

export const getAdminOrderById = (id) =>
    apiRequest(`/api/orders/admin/${id}`);

export const updateAdminOrderStatus = (id, status, reason = null) =>
    apiRequest(`/api/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
            status,
            reason,
        }),
    });

export const cancelAdminOrder = (id, reason) =>
    apiRequest(`/api/orders/admin/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
            reason,
        }),
    });

export const getOrderStatusHistory = (id) =>
    apiRequest(`/api/orders/admin/${id}/history`);
