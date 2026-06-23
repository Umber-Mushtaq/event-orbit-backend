import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A service must belong to a vendor"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A service must have a category"],
    },
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
    },
    price: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be a negative value"],
    },
    priceType: {
      type: String,
      enum: ["fixed", "per_guest", "hourly"],
      required: [true, "Price management type must be defined"],
    },
    location: {
      type: String,
      required: [true, "Service location is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      min: [0, "Guest capacity cannot be negative"],
    },
    images: [
      {
        type: String, // Store secure Cloudinary or file system asset string URLs
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot fall below 0"],
      max: [5, "Max rating cannot exceed 5"],
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({ title: "text", location: "text" });

const Service = mongoose.model("Service", serviceSchema);
export default Service;
