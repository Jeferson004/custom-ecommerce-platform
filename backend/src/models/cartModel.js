import pool from "../configs/db.js";

// GET /api/cart
export const getCartByProfileId = async (profileId) => {
  const cartResult = await pool.query(
    `SELECT id, profile_id, created_at, updated_at
         FROM carts
         WHERE profile_id = $1`,
    [profileId]
  );

  if (cartResult.rows.length === 0) {
    return {
      cart: null,
      items: [],
      total: 0,
    };
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

  return {
    cart,
    items: itemsResult.rows,
    total,
  };
};

// POST /api/cart/items
export const addItemToCart = async (profileId, productId, quantity) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the product row while checking its availability.
    const productResult = await client.query(
      `SELECT p.id, p.is_active, i.quantity AS stock
             FROM products p
             LEFT JOIN inventory i ON i.product_id = p.id
             WHERE p.id = $1
             FOR UPDATE OF p`,
      [productId]
    );

    if (
      productResult.rows.length === 0 ||
      !productResult.rows[0].is_active
    ) {
      const error = new Error("Product not found or inactive.");
      error.statusCode = 404;
      throw error;
    }

    const product = productResult.rows[0];

    if (
      product.stock === null ||
      Number(product.stock) < quantity
    ) {
      const error = new Error("Insufficient stock.");
      error.statusCode = 400;
      throw error;
    }

    // Create a cart if the user does not have one.
    const cartResult = await client.query(
      `INSERT INTO carts (profile_id)
             VALUES ($1)
             ON CONFLICT (profile_id)
             DO UPDATE SET updated_at = NOW()
             RETURNING id`,
      [profileId]
    );

    const cartId = cartResult.rows[0].id;

    // Add to the existing quantity if this product is already in the cart.
    const itemResult = await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET quantity =
                 cart_items.quantity + EXCLUDED.quantity
             RETURNING *`,
      [cartId, productId, quantity]
    );

    const item = itemResult.rows[0];

    // Validate the combined quantity, not just the new quantity.
    if (Number(item.quantity) > Number(product.stock)) {
      const error = new Error(
        "The requested cart quantity exceeds available stock."
      );
      error.statusCode = 400;
      throw error;
    }

    await client.query(
      `UPDATE carts
             SET updated_at = NOW()
             WHERE id = $1`,
      [cartId]
    );

    await client.query("COMMIT");

    return item;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// PUT /api/cart/items/:productId
export const updateCartItemQuantity = async (
  profileId,
  productId,
  quantity
) => {
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
    return null;
  }

  await pool.query(
    `UPDATE carts
         SET updated_at = NOW()
         WHERE profile_id = $1`,
    [profileId]
  );

  return result.rows[0];
};

// DELETE /api/cart/items/:productId
export const removeItemFromCart = async (profileId, productId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `DELETE FROM cart_items ci
             USING carts c
             WHERE ci.cart_id = c.id
               AND c.profile_id = $1
               AND ci.product_id = $2
             RETURNING ci.id`,
      [profileId, productId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `UPDATE carts
             SET updated_at = NOW()
             WHERE profile_id = $1`,
      [profileId]
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

// DELETE /api/cart/items
export const clearCartByProfileId = async (profileId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM cart_items
             WHERE cart_id IN (
                 SELECT id
                 FROM carts
                 WHERE profile_id = $1
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
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};