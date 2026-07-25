// import dns from "node:dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import userDashboardRoutes from "./src/routes/userDashboardRoutes.js";
import wishlistRoutes from "./src/routes/wishlistRoutes.js";
import blogRoutes from "./src/routes/blogRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

import "./src/models/Bookings.js";
import "./src/models/Category.js";
import "./src/models/Review.js";
import "./src/models/Service.js";
import "./src/models/User.js";
import "./src/models/Wishlist.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/categories", serviceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/userDashboard", userDashboardRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Resource API Route Not Found" });
});

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)[0]?.message || message;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path} format`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = duplicateField
      ? `${duplicateField} already exists`
      : "Duplicate key error";
  }

  res.status(statusCode).json({
    message,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
