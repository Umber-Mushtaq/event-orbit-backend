import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a customer"],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must target a vendor"],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Review must be linked to a service"],
    },
    rating: {
      type: Number,
      required: [true, "Please rate this service from 1 to 5 stars"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    comment: {
      type: String,
      required: [true, "Review commentary body text cannot be left blank"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Optional Security Pattern: Ensures a user can leave only ONE review per unique booking transaction instance
reviewSchema.index({ userId: 1, bookingId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
