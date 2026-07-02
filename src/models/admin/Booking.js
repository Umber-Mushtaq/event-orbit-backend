import mongoose from "mongoose";
import { createDisplayId } from "../../utils/adminHelpers.js";

const adminBookingSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      unique: true,
      index: true,
      default: () => createDisplayId("BK-"),
    },
    eventId: {
      type: String,
      default: "",
      trim: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Cancelled"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Confirmed", "Pending", "Cancelled", "Completed"],
      default: "Pending",
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    eventDate: {
      type: Date,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminBooking", adminBookingSchema);

