import mongoose from "mongoose";

const adminSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "global",
    },
    currency: {
      type: String,
      default: "USD",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    autoApproveCategories: {
      type: Boolean,
      default: false,
    },
    themeModes: {
      type: [String],
      default: ["Light", "Dark"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdminSetting", adminSettingSchema);

