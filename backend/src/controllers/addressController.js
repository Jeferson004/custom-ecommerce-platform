import pool from "../configs/db.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
    try {
        const profileId = req.user.id;

        const result = await pool.query(
            `SELECT *
            FROM addresses
            WHERE profile_id = $1
            ORDER BY is_default DESC, created_at DESC`,
            [profileId]
        );

        return res.status(200).json(result.rows);
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

        const result = await pool.query(
            `SELECT *
            FROM addresses
            WHERE id = $1 AND profile_id = $2`,
            [id, profileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Address not found.",
            });
        }

        return res.status(200).json(result.rows[0]);
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
        line2,
        city,
        postal_code,
        country,
        delivery_instructions,
        is_default = false,
    } = req.body;

    const profileId = req.user.id;

    if (!label || !full_name || !phone || !line1 ||
        !city || !postal_code || !country) {
        return res.status(400).json({
            message:
                "Label, full name, phone, address line 1, city, postal code, and country are required.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (is_default) {
            await client.query(
                `UPDATE addresses
                SET is_default = false, updated_at = NOW()
                WHERE profile_id = $1`,
                [profileId]
            );
        }

        const result = await client.query(
            `INSERT INTO addresses (
                profile_id,
                label,
                full_name,
                phone,
                line1,
                line2,
                city,
                postal_code,
                country,
                delivery_instructions,
                is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                profileId,
                label,
                full_name,
                phone,
                line1,
                line2 || null,
                city,
                postal_code,
                country,
                delivery_instructions || null,
                is_default,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Address created successfully.",
            address: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create address error:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Profile not found for this user.",
            });
        }

        return res.status(500).json({
            message: "Failed to create address.",
        });
    } finally {
        client.release();
    }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
    const { id } = req.params;
    const profileId = req.user.id;

    const {
        label,
        full_name,
        phone,
        line1,
        line2,
        city,
        postal_code,
        country,
        delivery_instructions,
        is_default,
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Confirm this address belongs to the authenticated profile.
        const existing = await client.query(
            `SELECT id
            FROM addresses
            WHERE id = $1 AND profile_id = $2
            FOR UPDATE`,
            [id, profileId]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Address not found.",
            });
        }

        if (is_default === true) {
            await client.query(
                `UPDATE addresses
         SET is_default = false, updated_at = NOW()
         WHERE profile_id = $1`,
                [profileId]
            );
        }

        const result = await client.query(
            `UPDATE addresses
            SET
                label = COALESCE($1, label),
                full_name = COALESCE($2, full_name),
                phone = COALESCE($3, phone),
                line1 = COALESCE($4, line1),
                line2 = CASE WHEN $5::boolean THEN $6 ELSE line2 END,
                city = COALESCE($7, city),
                postal_code = COALESCE($8, postal_code),
                country = COALESCE($9, country),
                delivery_instructions =
                CASE WHEN $10::boolean THEN $11 ELSE delivery_instructions END,
                is_default = COALESCE($12, is_default),
                updated_at = NOW()
            WHERE id = $13 AND profile_id = $14
            RETURNING *`,
            [
                label ?? null,
                full_name ?? null,
                phone ?? null,
                line1 ?? null,
                line2 !== undefined,
                line2 ?? null,
                city ?? null,
                postal_code ?? null,
                country ?? null,
                delivery_instructions !== undefined,
                delivery_instructions ?? null,
                is_default ?? null,
                id,
                profileId,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Address updated successfully.",
            address: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Update address error:", error);

        return res.status(500).json({
            message: "Failed to update address.",
        });
    } finally {
        client.release();
    }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const profileId = req.user.id;

        const result = await pool.query(
            `DELETE FROM addresses
            WHERE id = $1 AND profile_id = $2
            RETURNING id`,
            [id, profileId]
        );

        if (result.rows.length === 0) {
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