import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Wishlist bookmark must belong to a user profile"],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [
        true,
        "Wishlist mapping must specify a targeted listing service ID",
      ],
    },
  },
  {
    // Setting timestamps to true generates the native "createdAt" element requested in your notes
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Prevent adding the exact same service multiple times to a single user's wishlist
wishlistSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
