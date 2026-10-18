
import pool from "../configs/db.js";

// GET /api/addresses
export const findAddressesByProfileId = async (profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM addresses
         WHERE profile_id = $1
         ORDER BY is_default DESC, created_at DESC`,
        [profileId]
    );

    return result.rows;
};

// GET /api/addresses/:id
export const findAddressById = async (id, profileId) => {
    const result = await pool.query(
        `SELECT *
         FROM addresses
         WHERE id = $1 AND profile_id = $2`,
        [id, profileId]
    );

    return result.rows[0] || null;
};

// POST /api/addresses
export const createAddress = async (profileId, addressData) => {
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
    } = addressData;

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

        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// PUT /api/addresses/:id
export const updateAddress = async (id, profileId, addressData) => {
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
    } = addressData;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify ownership and lock the address during the transaction.
        const existing = await client.query(
            `SELECT id
             FROM addresses
             WHERE id = $1 AND profile_id = $2
             FOR UPDATE`,
            [id, profileId]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
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

        return result.rows[0] || null;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (id, profileId) => {
    const result = await pool.query(
        `DELETE FROM addresses
         WHERE id = $1 AND profile_id = $2
         RETURNING id`,
        [id, profileId]
    );

    return result.rows[0] || null;
};
