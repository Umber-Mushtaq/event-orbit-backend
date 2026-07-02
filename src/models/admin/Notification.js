import mongoose from "mongoose";
import { createDisplayId } from "../../utils/adminHelpers.js";

const adminNotificationSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      unique: true,
      index: true,
      default: () => createDisplayId("ntf_"),
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminNotification", adminNotificationSchema);

