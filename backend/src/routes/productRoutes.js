import express from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Public routes: browsing products
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes: staff and admin only
router.post(
    "/",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    createProduct
);

router.put(
    "/:id",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    updateProduct
);

router.delete(
    "/:id",
    authenticateUser,
    authorizeRoles("staff", "admin"),
    deleteProduct
);

export default router;