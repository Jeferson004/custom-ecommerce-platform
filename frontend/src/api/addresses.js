import { apiRequest } from "./client";

export const getAddresses = () =>
    apiRequest("/api/addresses");

export const getAddressById = (id) =>
    apiRequest(`/api/addresses/${id}`);

export const createAddress = (addressData) =>
    apiRequest("/api/addresses", {
        method: "POST",
        body: JSON.stringify(addressData),
    });

export const updateAddress = (id, addressData) =>
    apiRequest(`/api/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(addressData),
    });

export const deleteAddress = (id) =>
    apiRequest(`/api/addresses/${id}`, {
        method: "DELETE",
    });