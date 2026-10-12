import pool from "../configs/db.js";

// GET /api/cart
export const getCart = async (req, res) => {
    try {
        const profileId = req.user.id;

        const cartResult = await pool.query(
            `SELECT id, profile_id, created_at, updated_at
            FROM carts
            WHERE profile_id = $1`,
            [profileId]
        );

        if (cartResult.rows.length === 0) {
            return res.status(200).json({
                cart: null,
                items: [],
                total: 0,
            });
        }

        const cart = cartResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT
                ci.id,
                ci.product_id,
                p.name,
                p.price,
                ci.quantity,
                (p.price * ci.quantity) AS subtotal
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = $1
            ORDER BY ci.id`,
            [cart.id]
        );

        const total = itemsResult.rows.reduce(
            (sum, item) => sum + Number(item.subtotal),
            0
        );

        return res.status(200).json({
            cart,
            items: itemsResult.rows,
            total,
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            message: "Failed to retrieve cart.",
        });
    }
};

// POST /api/cart/items
export const addCartItem = async (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    const profileId = req.user.id;

    if (
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            message: "Quantity must be a positive integer.",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Confirm the product exists and is active.
        const productResult = await client.query(
            `SELECT p.id, p.is_active, i.quantity AS stock
            FROM products p
            LEFT JOIN inventory i ON i.product_id = p.id
            WHERE p.id = $1
            FOR UPDATE OF p`,
            [product_id]
        );

        if (
            productResult.rows.length === 0 ||
            !productResult.rows[0].is_active
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found or inactive.",
            });
        }

        const product = productResult.rows[0];

        if (
            product.stock === null ||
            Number(product.stock) < quantity
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Insufficient stock.",
            });
        }

        // Create the user's cart if necessary.
        const cartResult = await client.query(
            `INSERT INTO carts (profile_id)
            VALUES ($1)
            ON CONFLICT (profile_id)
            DO UPDATE SET updated_at = NOW()
            RETURNING id`,
            [profileId]
        );

        const cartId = cartResult.rows[0].id;

        // Add to the existing quantity if the product is already in the cart.
        const itemResult = await client.query(
            `INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET quantity =
                cart_items.quantity + EXCLUDED.quantity
            RETURNING *`,
            [cartId, product_id, quantity]
        );

        // Check the combined quantity against stock.
        const combinedQuantity = itemResult.rows[0].quantity;

        if (Number(combinedQuantity) > Number(product.stock)) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "The requested cart quantity exceeds available stock.",
            });
        }

        await client.query("UPDATE carts SET updated_at = NOW() WHERE id = $1", [
            cartId,
        ]);

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Product added to cart successfully.",
            item: itemResult.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Add cart item error:", error);

        return res.status(500).json({
            message: "Failed to add product to cart.",
        });
    } finally {
        client.release();
    }
};

// PUT /api/cart/items/:productId
export const updateCartItem = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const profileId = req.user.id;

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            message: "Quantity must be a positive integer.",
        });
    }

    try {
        const result = await pool.query(
            `UPDATE cart_items ci
            SET quantity = $1
            FROM carts c, products p, inventory i
            WHERE ci.cart_id = c.id
                AND ci.product_id = p.id
                AND p.id = i.product_id
                AND c.profile_id = $2
                AND ci.product_id = $3
                AND p.is_active = true
                AND i.quantity >= $1
            RETURNING ci.*`,
            [quantity, profileId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found, product inactive, or insufficient stock.",
            });
        }

        await pool.query(
            `UPDATE carts
            SET updated_at = NOW()
            WHERE profile_id = $1`,
            [profileId]
        );

        return res.status(200).json({
            message: "Cart item quantity updated successfully.",
            item: result.rows[0],
        });
    } catch (error) {
        console.error("Update cart item error:", error);
        return res.status(500).json({
            message: "Failed to update cart item.",
        });
    }
};

// DELETE /api/cart/items/:productId
export const removeCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const profileId = req.user.id;

        const result = await pool.query(
            `DELETE FROM cart_items ci
            USING carts c
            WHERE ci.cart_id = c.id
                AND c.profile_id = $1
                AND ci.product_id = $2
            RETURNING ci.id`,
            [profileId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found.",
            });
        }

        await pool.query(
            `UPDATE carts
            SET updated_at = NOW()
            WHERE profile_id = $1`,
            [profileId]
        );

        return res.status(200).json({
            message: "Product removed from cart successfully.",
        });
    } catch (error) {
        console.error("Remove cart item error:", error);
        return res.status(500).json({
            message: "Failed to remove cart item.",
        });
    }
};

// DELETE /api/cart/items
export const clearCart = async (req, res) => {
    const client = await pool.connect();

    try {
        const profileId = req.user.id;

        await client.query("BEGIN");

        await client.query(
            `DELETE FROM cart_items
            WHERE cart_id IN (
                SELECT id FROM carts WHERE profile_id = $1
       )`,
            [profileId]
        );

        await client.query(
            `UPDATE carts
            SET updated_at = NOW()
            WHERE profile_id = $1`,
            [profileId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Cart cleared successfully.",
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Clear cart error:", error);

        return res.status(500).json({
            message: "Failed to clear cart.",
        });
    } finally {
        client.release();
    }
};