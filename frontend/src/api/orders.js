import { apiRequest } from "./client";

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