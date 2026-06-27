import express from "express";
import mongoose from "mongoose";
import {
  getBookedDates,
  getVendorBookings,
  updateBookingStatus,
  createBooking,
  getCustomerBookings,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/booked-dates", getBookedDates);
router.get("/bookings", protect, getCustomerBookings);
router.post("/service/:serviceId/vendor/:vendorId", protect, createBooking);
router.route("/requests").get(protect, getVendorBookings);
router.route("/requests/:id").patch(protect, updateBookingStatus);

export default router;
