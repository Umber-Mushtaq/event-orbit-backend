import express from "express";
import {
  getServiceReviews,
  getVendorDashboardReviews,
  addReview,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addReview);
router.get("/service/:serviceId", getServiceReviews);
router.get("/vendor-dashboard", protect, getVendorDashboardReviews);

export default router;
