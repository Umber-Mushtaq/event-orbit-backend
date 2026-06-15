import { asyncHandler } from "../middlewares/asyncHandler.js";
import * as authService from "../services/authService.js";

// @desc    Unified Register for Customers & Vendors (Role sent from frontend)
// @route   POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  // req.body contains { firstName, lastName, email, password, role }
  const result = await authService.registerUnifiedUser(req.body);
  res.status(201).json(result);
});

// @desc    Shared Login Path for Customers & Vendors
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  // req.body contains { email, password }
  const result = await authService.loginUnifiedUser(req.body);
  res.status(200).json(result);
});

// @desc    Forgot Password - Sends email token
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.processForgotPassword(req.body.email);
  res.status(200).json({ message: "Reset email sent successfully" });
});

// @desc    Reset Password via Token
// @route   POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  await authService.processResetPassword(req.params.token, req.body.password);
  res
    .status(200)
    .json({ message: "Password reset successful! You can now log in." });
});
