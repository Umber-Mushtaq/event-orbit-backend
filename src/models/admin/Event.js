import mongoose from "mongoose";
import { createDisplayId } from "../../utils/adminHelpers.js";

const adminEventSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      unique: true,
      index: true,
      default: () => createDisplayId("EVT-"),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed", "Draft", "Cancelled"],
      default: "Draft",
    },
    attendees: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizerName: {
      type: String,
      default: "",
      trim: true,
    },
    organizerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    organizerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vendorId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminEvent", adminEventSchema);

