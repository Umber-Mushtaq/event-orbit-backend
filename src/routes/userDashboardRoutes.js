import express from "express";
import {
  getUserDashboardOverview,
  getCustomerProfile,
  updateCustomerProfile,
} from "../controllers/userDashboardController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("customer"));

router.get("/overview", protect, getUserDashboardOverview);
router
  .route("/profile")
  .get(getCustomerProfile)
  .put(upload.single("avatar"), updateCustomerProfile);

export default router;
