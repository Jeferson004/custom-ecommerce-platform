import express from "express";
import {
    getProducts,
    getProduct,
    addProduct,
    editProduct,
    removeProduct
} from "../controllers/productController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", upload.single("image"), addProduct);
router.put("/:id", upload.single("image"), editProduct);
router.delete("/:id", removeProduct);

export default router;