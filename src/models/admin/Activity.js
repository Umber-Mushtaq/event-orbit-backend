import mongoose from "mongoose";
import { createDisplayId } from "../../utils/adminHelpers.js";

const adminActivitySchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      unique: true,
      index: true,
      default: () => createDisplayId("act_"),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    time: {
      type: String,
      default: "",
      trim: true,
    },
    tone: {
      type: String,
      default: "neutral",
      trim: true,
    },
    icon: {
      type: String,
      default: "bell",
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminActivity", adminActivitySchema);

