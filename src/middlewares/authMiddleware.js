// backend/src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Adjust this path to match your exact User model location

export const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Check if the token exists inside the incoming request headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Split "Bearer <JWT_TOKEN_STRING>" to extract the token string itself
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. If no token is attached, deny entry instantly
    if (!token) {
      const error = new Error(
        "Not authorized to access this route. Login required.",
      );
      error.statusCode = 401;
      throw error;
    }

    // 3. Decode and verify the integrity of the JWT token string
    // This extracts the exact user { id } object we encrypted inside generateToken()
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Look up the user in MongoDB using the id parsed out from the verified payload
    // We append .select("-password") so we never accidentally carry the hashed password string in memory
    const currentUser = await User.findById(decoded.id).select("-password");

    if (!currentUser) {
      const error = new Error(
        "The user belonging to this token no longer exists.",
      );
      error.statusCode = 401;
      throw error;
    }

    // 5. Attach the clean user document right into the Express request context lifecycle
    req.user = currentUser;

    // Everything checks out! Move onto your actual route handler or controller logic
    next();
  } catch (error) {
    // If jwt.verify fails due to timeout or manipulation, force catch to standard JSON error
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      error.message =
        "Your login session has expired or is invalid. Please sign in again.";
      error.statusCode = 401;
    }
    next(error);
  }
};

/**
 * Role Restriction Middleware Wrapper Guard
 * @param  {...String} roles - The string values of allowed system profiles (e.g., 'vendor', 'admin')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user was successfully attached right above by our protect middleware
    if (!roles.includes(req.user.role)) {
      const error = new Error(
        "Access Denied: You do not have permissions to perform this action.",
      );
      error.statusCode = 403; // Forbidden
      return next(error);
    }
    next();
  };
};
