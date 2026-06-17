import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Must point to a user with role: "customer"
      required: [true, "Booking requires a customer ID"],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Points to a user with role: "vendor"
      required: [true, "Booking requires a vendor ID"],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Booking must target a valid service item"],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    eventDate: {
      type: Date,
      required: [
        true,
        "Wedding/Event scheduled calendar target date is required",
      ],
    },
    guestsCount: {
      type: Number,
      required: [true, "Guest size approximation count is required"],
      min: [1, "Guests count must be at least 1"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Final calculated balance total amount is required"],
      min: [0, "Total transaction amount cannot be negative"],
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
