import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Public Authentication Routes
router.post("/register", upload.single("profileImage"), registerUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
