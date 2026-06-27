import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getCustomerWishlist,
  toggleWishlistService,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", protect, getCustomerWishlist);
router.post("/toggle", protect, toggleWishlistService);

export default router;
