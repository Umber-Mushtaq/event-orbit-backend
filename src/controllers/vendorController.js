import Booking from "../models/Bookings.js";
import Review from "../models/Review.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";

export const getVendorDashboardOverview = async (req, res, next) => {
  try {
    // req.user.id comes from your auth middleware protecting this route
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const today = new Date();

    // 1. Run Aggregation for Booking-related Metrics
    const bookingStats = await Booking.aggregate([
      { $match: { vendorId: vendorId } },
      {
        $facet: {
          totalBookings: [{ $count: "count" }],
          upcomingEvents: [
            {
              $match: {
                eventDate: { $gte: today },
                bookingStatus: "pending",
              },
            },
            { $count: "count" },
          ],
          earnings: [
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          pendingPayments: [
            {
              $match: {
                paymentStatus: "pending",
                bookingStatus: { $ne: "cancelled" },
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
        },
      },
    ]);

    // 2. Run Aggregation for Review-related Metrics
    const reviewStats = await Review.aggregate([
      { $match: { vendorId: vendorId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    // 3. Extract and safely parse data outputs from aggregation array structures
    const totalBookings = bookingStats[0]?.totalBookings[0]?.count || 0;
    const upcomingEvents = bookingStats[0]?.upcomingEvents[0]?.count || 0;
    const totalEarnings = bookingStats[0]?.earnings[0]?.total || 0;
    const pendingPayments = bookingStats[0]?.pendingPayments[0]?.total || 0;
    const averageRating = reviewStats[0]?.averageRating
      ? Number(reviewStats[0].averageRating.toFixed(1))
      : 0;

    // Send data structured perfectly for the UI metrics layout card array maps
    res.status(200).json({
      success: true,
      metrics: {
        totalBookings,
        upcomingEvents,
        totalEarnings,
        pendingPayments,
        averageRating,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingBookings = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const today = new Date();

    // Fetch the 3 most imminent, non-cancelled bookings
    const bookings = await Booking.find({
      vendorId: vendorId,
      eventDate: { $gte: today }, // Only fetch present or future upcoming events
      bookingStatus: { $ne: "cancelled" },
    })
      .populate("serviceId", "title") // Plucks only the 'title' string property from the Service model
      .sort({ eventDate: 1 }); // Sort ascending: closest date to today shows up first

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentReviews = async (req, res, next) => {
  try {
    const vendorId = req.user.id;

    const reviews = await Review.find({ vendorId })
      .populate("userId", "firstName lastName profileImage") // Pull reviewer name and avatar
      .populate("serviceId", "title") // Pull service name
      .sort({ createdAt: -1 }) // Newest reviews show up at the top
      .limit(4);

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const {
      title,
      categoryId,
      description,
      price,
      priceType,
      location,
      capacity,
    } = req.body;

    // 1. Ensure files are present
    if (!req.files || req.files.length === 0) {
      const error = new Error(
        "Please upload at least one showcase image for your service.",
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Map through raw buffers and stream them concurrently to Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer),
    );
    const uploadedImageUrls = await Promise.all(uploadPromises);

    // 3. Save listing record to MongoDB with Cloudinary URL links
    const newService = await Service.create({
      vendorId: req.user.id,
      categoryId,
      title,
      description,
      price: Number(price),
      priceType,
      location,
      capacity: capacity ? Number(capacity) : undefined,
      images: uploadedImageUrls, // Array of secure strings like: ["https://res.cloudinary.com/..."]
    });

    res.status(201).json({
      success: true,
      message: "Service listing package published successfully!",
      service: newService,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorServices = async (req, res, next) => {
  try {
    // req.user.id comes from your protect middleware token parser
    const services = await Service.find({ vendorId: req.user.id })
      .populate("categoryId", "name") // Automatically populates category details (e.g., name)
      .sort("-createdAt"); // Keeps newly added packages at the top

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the document and verify the logged-in vendor actually owns it
    const service = await Service.findOne({ _id: id, vendorId: req.user.id });

    if (!service) {
      const error = new Error(
        "Service package not found or unauthorized operation.",
      );
      error.statusCode = 404;
      throw error;
    }

    // Optional: If you want to delete files from Cloudinary storage when a service is deleted,
    // you could extract public_ids from service.images and call cloudinary.uploader.destroy() here.

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: "Service listing package deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleVendorService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify the service exists and belongs to the authenticated vendor
    const service = await Service.findOne({
      _id: id,
      vendorId: req.user.id,
    }).populate("categoryId", "name");

    if (!service) {
      const error = new Error(
        "Service package not found or unauthorized access.",
      );
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      services: service, // Named 'services' to cleanly match your frontend hook destructuring
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      categoryId,
      description,
      price,
      priceType,
      location,
      capacity,
      existingImages, // 🔥 Added: Array sent from frontend containing URLs that weren't deleted
    } = req.body;

    // 1. Locate the document and check ownership permissions
    let service = await Service.findOne({ _id: id, vendorId: req.user.id });

    if (!service) {
      const error = new Error(
        "Service package not found or unauthorized operation.",
      );
      error.statusCode = 404;
      throw error;
    }

    // 2. Sync Existing Images Layout
    // If existingImages is passed as a JSON string from FormData, parse it; otherwise use the raw array/fallback.
    let remainingImages = [];
    if (existingImages) {
      remainingImages =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : existingImages;
    } else {
      // Fallback: If your frontend didn't send anything, default to keeping original images
      remainingImages = service.images || [];
    }

    // 3. Process new file uploads to Cloudinary if they exist
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer),
      );
      const newUploadedUrls = await Promise.all(uploadPromises);

      // Merge new image links with the remaining retained images
      remainingImages = [...remainingImages, ...newUploadedUrls];
    }

    // 4. Update core properties safely
    service.title = title || service.title;
    service.description = description || service.description;
    service.price = price ? Number(price) : service.price;
    service.priceType = priceType || service.priceType;
    service.location = location || service.location;
    service.capacity =
      capacity !== undefined && capacity !== "" ? Number(capacity) : undefined;
    service.images = remainingImages;

    // 🔥 5. Bulletproof Category Validation
    // Avoid setting literal string "null" or empty strings which cause schema cast validation errors
    if (
      categoryId &&
      categoryId !== "null" &&
      categoryId !== "undefined" &&
      categoryId !== ""
    ) {
      service.categoryId = categoryId;
    } else {
      // Retain the existing valid ObjectId already assigned inside MongoDB
      service.categoryId = service.categoryId;
    }

    const savedService = await service.save();

    res.status(200).json({
      success: true,
      message: "Service package updated successfully!",
      service: savedService,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      address,
      businessName,
      businessDescription,
      vendorBio,
      socialLinks, // Sent as a JSON string from your FormData block
    } = req.body;

    // 1. Fetch the existing profile document
    const userProfile = await User.findById(userId);

    if (!userProfile) {
      const error = new Error("Vendor profile registry not found.");
      error.statusCode = 404;
      throw error;
    }

    // 2. Handle Cloudinary Upload for the profile Avatar if a new file is attached
    if (req.file) {
      // Utilizing your existing config asset utility stream wrapper
      const uploadedAvatarUrl = await uploadToCloudinary(req.file.buffer);
      userProfile.profileImage = uploadedAvatarUrl;
    }

    // 3. Update Text and Numeric parameters safely
    userProfile.firstName =
      firstName !== undefined ? firstName : userProfile.firstName;
    userProfile.lastName =
      lastName !== undefined ? lastName : userProfile.lastName;
    userProfile.phone = phone !== undefined ? phone : userProfile.phone;
    userProfile.address = address !== undefined ? address : userProfile.address;
    userProfile.businessName =
      businessName !== undefined ? businessName : userProfile.businessName;
    userProfile.businessDescription =
      businessDescription !== undefined
        ? businessDescription
        : userProfile.businessDescription;
    userProfile.vendorBio =
      vendorBio !== undefined ? vendorBio : userProfile.vendorBio;

    // 4. Safely Parse and Update Nest Sub-document Link Objects
    if (socialLinks) {
      try {
        const parsedSocials =
          typeof socialLinks === "string"
            ? JSON.parse(socialLinks)
            : socialLinks;

        // Merge links layout object properties gracefully onto your schema fields fallback
        userProfile.socialLinks = {
          website:
            parsedSocials.website !== undefined
              ? parsedSocials.website
              : userProfile.socialLinks?.website,
          instagram:
            parsedSocials.instagram !== undefined
              ? parsedSocials.instagram
              : userProfile.socialLinks?.instagram,
          linkedin:
            parsedSocials.linkedin !== undefined
              ? parsedSocials.linkedin
              : userProfile.socialLinks?.linkedin,
          facebook:
            parsedSocials.facebook !== undefined
              ? parsedSocials.facebook
              : userProfile.socialLinks?.facebook,
        };
      } catch (e) {
        // Fallback catch block to protect execution flow if JSON string parsing drops out
        const error = new Error(
          "Invalid format encountered handling structured social layout data payloads.",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // 5. Commit mutations to MongoDB database instance storage
    const updatedProfile = await userProfile.save();

    // Mask sensitive fields like password strings before sending back
    updatedProfile.password = undefined;

    res.status(200).json({
      success: true,
      message: "Profile settings updated successfully!",
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.params.id;
    const userProfile = await User.findById(userId).select("-password");
    if (!userProfile) {
      const error = new Error("Vendor profile registry not found.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      profile: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicVendorProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const userProfile = await User.findById(userId).select("-password");
    if (!userProfile || userProfile.role !== "vendor") {
      const error = new Error("Vendor profile registry not found.");
      error.statusCode = 404;
      throw error;
    }
    const reviews = await Review.find({ vendorId: userId })
      .populate("userId", "firstName lastName profileImage")
      .populate("serviceId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      profile: userProfile,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.status(200).json({
      success: true,
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    next(error);
  }
};
