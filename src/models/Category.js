import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: "tags",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Inactive"],
      default: "Active",
    },
    vendors: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    listings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
