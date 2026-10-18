import {
    findAddressesByProfileId,
    findAddressById,
    createAddress as createAddressModel,
    updateAddress as updateAddressModel,
    deleteAddress as deleteAddressModel,
} from "../models/addressModel.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
    try {
        const profileId = req.user.id;

        const addresses = await findAddressesByProfileId(profileId);

        return res.status(200).json(addresses);
    } catch (error) {
        console.error("Get addresses error:", error);

        return res.status(500).json({
            message: "Failed to retrieve addresses.",
        });
    }
};

// GET /api/addresses/:id
export const getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const address = await findAddressById(id, profileId);

        if (!address) {
            return res.status(404).json({
                message: "Address not found.",
            });
        }

        return res.status(200).json(address);
    } catch (error) {
        console.error("Get address error:", error);

        return res.status(500).json({
            message: "Failed to retrieve address.",
        });
    }
};

// POST /api/addresses
export const createAddress = async (req, res) => {
    const {
        label,
        full_name,
        phone,
        line1,
        city,
        postal_code,
        country,
    } = req.body;

    if (
        !label ||
        !full_name ||
        !phone ||
        !line1 ||
        !city ||
        !postal_code ||
        !country
    ) {
        return res.status(400).json({
            message:
                "Label, full name, phone, address line 1, city, postal code, and country are required.",
        });
    }

    try {
        const profileId = req.user.id;

        const address = await createAddressModel(profileId, req.body);

        return res.status(201).json({
            message: "Address created successfully.",
            address,
        });
    } catch (error) {
        console.error("Create address error:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Profile not found for this user.",
            });
        }

        return res.status(500).json({
            message: "Failed to create address.",
        });
    }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const address = await updateAddressModel(
            id,
            profileId,
            req.body
        );

        if (!address) {
            return res.status(404).json({
                message: "Address not found.",
            });
        }

        return res.status(200).json({
            message: "Address updated successfully.",
            address,
        });
    } catch (error) {
        console.error("Update address error:", error);

        return res.status(500).json({
            message: "Failed to update address.",
        });
    }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const deletedAddress = await deleteAddressModel(id, profileId);

        if (!deletedAddress) {
            return res.status(404).json({
                message: "Address not found.",
            });
        }

        return res.status(200).json({
            message: "Address deleted successfully.",
        });
    } catch (error) {
        console.error("Delete address error:", error);

        return res.status(500).json({
            message: "Failed to delete address.",
        });
    }
};