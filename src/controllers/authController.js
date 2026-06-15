import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  c;
};

// @desc    Register Standard Customer/User
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "user",
    });

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register Vendor (Requires Admin Approval)
// @route   POST /api/auth/vendor-register
export const registerVendor = async (req, res) => {
  try {
    const { businessName, ownerName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Account already exists with this email" });
    }

    const vendor = await User.create({
      businessName,
      ownerName,
      email,
      password,
      role: "vendor",
      isApproved: false,
    });

    res.status(201).json({
      message:
        "Registration successful! Your account is pending admin approval before you can log in.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Shared Login for User & Vendor
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.role === "admin") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "vendor" && !user.isApproved) {
      return res
        .status(403)
        .json({ message: "Your vendor account is pending admin approval." });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        ...(user.role === "user"
          ? { firstName: user.firstName, lastName: user.lastName }
          : { businessName: user.businessName, ownerName: user.ownerName }),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Access Denied. Not an admin." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Sends email token
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Create unique, random reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and save to database with a 10-minute expiry time
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Construct link pointing to your frontend route mapping
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const messageHtml = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
      <p>Please click on the link below to complete the process:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Token",
        html: messageHtml,
      });
      res.json({ message: "Reset email sent successfully" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password via Token
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    // Hash the token from URL parameters to match against database value
    const tokenCrypto = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenCrypto,
      resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
