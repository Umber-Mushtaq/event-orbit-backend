import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    isApproved: {
      type: Boolean,
      // Vendors default to false (needs admin approval), customers and admins default to true
      default: function () {
        return this.role !== "vendor";
      },
    },

    // ==========================================
    // Vendor Specific Fields (Filled After Login)
    // ==========================================
    businessName: {
      type: String,
      default: "",
      trim: true,
    },
    businessDescription: {
      type: String,
      default: "",
    },
    vendorBio: {
      type: String,
      default: "",
    },
    whatsappNumber: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },

    // Password Reset Tokens
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  },
);

// Encrypt password before saving
userSchema.pre("save", async function () {
  // 1. Removed 'next' here
  if (!this.isModified("password")) return; // 2. Changed to a simple return

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // 3. Removed next() from here, Mongoose proceeds automatically when done
  } catch (error) {
    throw error; // 4. Throwing the error replaces next(error)
  }
});

// Match password instance method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
