import pool from "../configs/db.js";

export const getAllProducts = async () => {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    return rows;
};

export const getProductById = async (id) => {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    return rows[0];
};

export const createProduct = async (name, price, image) => {
    const [result] = await pool.query(`INSERT INTO products (name, price, image) VALUES (?, ?, ?)`, [name, price, image]);
    return result.insertId;
};

export const updateProduct = async (id, name, price, image) => {
    const [result] = await pool.query(`UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?`, [name, price, image, id]);
    return result;
};

export const deleteProduct = async (id) => {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
    return result;
};