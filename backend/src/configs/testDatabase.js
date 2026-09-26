import pool from "./db.js"

try {
    const result = await pool.query("SELECT NOW()");

    console.log("Database connected successfully:", result.rows[0]);
} catch (error) {
    console.error("Error connecting to the database:", error);
    console.error(error)
}