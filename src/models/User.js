import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function () {
        return this.role === "user";
      },
      trim: true,
    },
    lastName: {
      type: String,
      required: function () {
        return this.role === "user";
      },
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    // Vendor Specific Fields
    businessName: {
      type: String,
      required: function () {
        return this.role === "vendor";
      },
      trim: true,
    },
    ownerName: {
      type: String,
      required: function () {
        return this.role === "vendor";
      },
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role === "admin" || this.role === "user";
      },
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
