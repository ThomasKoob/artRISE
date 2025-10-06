import { Router } from "express";
import {
  getShippingAddress,
  createOrUpdateShippingAddress,
  getUserShippingAddresses,
  updateShippingStatus,
  verifyWinner,
} from "../controllers/shipping.controller.js";
import auth from "../middlewares/auth.js";

const router = Router();

// All routes require authentication
router.use(auth);

// Verify winner can access shipping page
router.get("/verify/:artworkId", verifyWinner);

// Get shipping address for specific artwork
router.get("/:artworkId", getShippingAddress);

// Create or update shipping address
router.post("/:artworkId", createOrUpdateShippingAddress);

// Get all shipping addresses for current user
router.get("/", getUserShippingAddresses);

// Update shipping status (admin/seller only - add role check if needed)
router.patch("/:id/status", updateShippingStatus);

export default router;
