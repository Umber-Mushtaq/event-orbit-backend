import express from "express";
import mongoose from "mongoose";
import {
  getBookedDates,
  getVendorBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Changed from "/booked-dates/:serviceId" to support query strings (?serviceId=...)
router.get("/booked-dates", getBookedDates);

router.route("/requests").get(protect, getVendorBookings);
router.route("/requests/:id").patch(protect, updateBookingStatus);

export default router;
