import pool from "../configs/db.js";

export const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    error: "Authentication required."
                });
            }

            const result = await pool.query(
                "SELECT role FROM profiles WHERE id = $1 LIMIT 1",
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    error: "User profile not found."
                });
            }

            const userRole = result.rows[0].role;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: "You do not have permission to perform this action."
                });
            }

            req.userRole = userRole;
            return next();
        } catch (error) {
            console.error("Authorization middleware error:", error);

            return res.status(500).json({
                error: "Unable to verify user permissions."
            });
        }
    };
};