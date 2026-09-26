import supabase from "../configs/supabase.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header missing" });
        }

        const token = authHeader.split(" ")[1];

        const { data: user, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        req.user = user;
        next();
    }

    catch (error) {
        console.error("Error authenticating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}