import express from "express";
import { upload } from "../config/cloudinary.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();
const authRateLimit = createRateLimit({ max: 8, windowMs: 15 * 60 * 1000, keyPrefix: "auth" });

// Public Authentication Routes
router.post("/register", authRateLimit, upload.single("profileImage"), registerUser);
router.post("/login", authRateLimit, login);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password/:token", authRateLimit, resetPassword);

export default router;
