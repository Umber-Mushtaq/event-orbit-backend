import mongoose from "mongoose";

const adminPreferenceSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      default: "Dark",
    },
    sidebarCollapsed: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "en",
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminPreference", adminPreferenceSchema);

