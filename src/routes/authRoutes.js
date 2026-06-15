import express from "express";
import {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Public Authentication Routes
router.post("/register", registerUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
