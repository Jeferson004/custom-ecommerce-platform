import { apiRequest } from "./client";

// Retrieve all inventory records.
export const getInventory = () => {
  return apiRequest("/api/inventory");
};

// Retrieve inventory for a specific product.
export const getInventoryByProductId = (productId) => {
  return apiRequest(`/api/inventory/${productId}`);
};

// Create an inventory record for a product.
export const createInventory = (productId, quantity) => {
  return apiRequest("/api/inventory", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      quantity,
    }),
  });
};

// Update the stock quantity.
export const updateInventory = (productId, quantity) => {
  return apiRequest(`/api/inventory/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
};

// Retrieve inventory transaction history.
export const getInventoryTransactions = () => {
  return apiRequest("/api/inventory/transactions");
};