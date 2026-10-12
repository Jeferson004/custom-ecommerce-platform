import express from "express";

import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

// Replace this import with your existing authentication middleware.
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getAddresses);
router.get("/:id", getAddressById);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;