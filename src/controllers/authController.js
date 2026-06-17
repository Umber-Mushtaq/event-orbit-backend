import { asyncHandler } from "../middlewares/asyncHandler.js";
import * as authService from "../services/authService.js";

export const registerUser = asyncHandler(async (req, res) => {
  const result = await authService.registerUnifiedUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUnifiedUser(req.body);
  res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.processForgotPassword(req.body.email);
  res.status(200).json({ message: "Reset email sent successfully" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.processResetPassword(req.params.token, req.body.password);
  res
    .status(200)
    .json({ message: "Password reset successful! You can now log in." });
});
