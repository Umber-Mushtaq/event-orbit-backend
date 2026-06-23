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
import "./src/models/Bookings.js";
import "./src/models/Category.js";
import "./src/models/Review.js";
import "./src/models/Service.js";
import "./src/models/User.js";
import "./src/models/Wishlist.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/userDashboard", userDashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Resource API Route Not Found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
