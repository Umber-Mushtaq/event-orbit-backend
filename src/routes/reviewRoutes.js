import express from "express";
import {
  getServiceReviews,
  getVendorDashboardReviews,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public route to pull feedback lists
router.get("/service/:serviceId", getServiceReviews);
router.get("/vendor-dashboard", protect, getVendorDashboardReviews);

export default router;
