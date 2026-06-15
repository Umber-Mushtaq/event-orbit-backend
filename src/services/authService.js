import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Unified Registration Flow
export const registerUnifiedUser = async ({
  firstName,
  lastName,
  email,
  password,
  role,
}) => {
  if (role === "admin") {
    throw new Error("Unauthorized role assignment.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error("An account already exists with this email");
    err.statusCode = 400;
    throw err;
  }

  // Create user using your clean layout details
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || "customer",
  });

  if (user.role === "vendor") {
    return {
      message:
        "Registration successful! Your vendor account is pending admin approval before you can log in.",
      requiresApproval: true,
    };
  }

  const token = generateToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

// Unified Login Flow
export const loginUnifiedUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user || user.role === "admin") {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (user.role === "vendor" && !user.isApproved) {
    const err = new Error("Your vendor account is pending admin approval.");
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken(user._id);

  // Return the data object with all your new fields available for the client dashboard
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isApproved: user.isApproved,
      phoneNumber: user.phoneNumber,
      address: user.address,
      profileImage: user.profileImage,
      // Vendor fields fall back safely to empty strings if not set yet
      ...(user.role === "vendor" && {
        businessName: user.businessName,
        businessDescription: user.businessDescription,
        vendorBio: user.vendorBio,
        whatsappNumber: user.whatsappNumber,
        instagram: user.instagram,
        linkedin: user.linkedin,
        facebook: user.facebook,
        website: user.website,
      }),
    },
  };
};

// Process Forgot Password - Generate & Hash Token, Send Email
export const processForgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    const err = new Error("No user found with this email");
    err.statusCode = 404;
    throw err;
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
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const err = new Error("Email could not be sent");
    err.statusCode = 500;
    throw err;
  }
};

// Process Reset Password - Verify Token & Update Password
export const processResetPassword = async (token, newPassword) => {
  // Hash the token from URL parameters to match against database value
  const tokenCrypto = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenCrypto,
    resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) {
    const err = new Error("Invalid or expired password reset token");
    err.statusCode = 400;
    throw err;
  }

  // Update password field (the pre-save hook handles hashing)
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
};
