// backend/src/routes/vendorRoutes.js
import express from "express";
import {
  getVendorDashboardOverview,
  getUpcomingBookings,
  getRecentReviews,
  createService,
  getVendorServices,
  deleteService,
  getSingleVendorService,
  updateService,
  updateVendorProfile,
  getVendorProfile,
  getAllVendors,
  getPublicVendorProfile,
} from "../controllers/vendorController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/all", getAllVendors);
router.get("/Profile/:id", getPublicVendorProfile);

router.use(protect);
router.use(restrictTo("vendor"));

router.get("/dashboard-overview", getVendorDashboardOverview);
router.get("/upcoming-bookings", getUpcomingBookings);
router.get("/recent-reviews", getRecentReviews);

router
  .route("/services")
  .get(getVendorServices)
  .post(upload.array("images", 6), createService);

router
  .route("/services/:id")
  .get(getSingleVendorService)
  .put(upload.array("images", 6), updateService)
  .delete(deleteService);

router
  .route("/profile")
  .get(protect, getVendorProfile)
  .put(protect, upload.single("avatar"), updateVendorProfile);

export default router;
