import express from "express";
import {
  registerUser,
  registerVendor,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/vendor-register", registerVendor);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
