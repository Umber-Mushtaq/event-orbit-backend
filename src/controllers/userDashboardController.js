import Booking from "../models/Bookings.js";
import Review from "../models/Review.js";
import Wishlist from "../models/Wishlist.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";

export const getUserDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalBookingsCount = await Booking.countDocuments({ userId });
    const totalWishlistCount = await Wishlist.countDocuments({ userId });
    const financialStats = await Booking.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          bookingStatus: { $in: ["confirmed", "completed"] },
        },
      },
      { $group: { _id: null, totalSpent: { $sum: "$totalAmount" } } },
    ]);
    const totalSpentAmount =
      financialStats.length > 0 ? financialStats[0].totalSpent : 0;
    const bookingsList = await Booking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { eventDate: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      { $unwind: "$vendorInfo" },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      { $unwind: "$serviceInfo" },
      {
        $project: {
          id: "$_id",
          vendorName: {
            $concat: ["$vendorInfo.firstName", " ", "$vendorInfo.lastName"],
          },
          avatar: "$vendorInfo.profileImage",
          category: "$serviceInfo.category",
          thumbnail: { $arrayElemAt: ["$serviceInfo.images", 0] },
          eventName: "$serviceInfo.title",
          time: { $dateToString: { format: "%Y-%m-%d", date: "$eventDate" } },
          status: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$bookingStatus", "pending"] },
                  then: "Pending",
                },
                {
                  case: { $eq: ["$bookingStatus", "confirmed"] },
                  then: "Confirmed",
                },
                {
                  case: { $eq: ["$bookingStatus", "completed"] },
                  then: "Completed",
                },
                {
                  case: { $eq: ["$bookingStatus", "cancelled"] },
                  then: "Cancelled",
                },
              ],
              default: "Pending",
            },
          },
        },
      },
    ]);
    const reviewsFeed = await Review.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          id: "$_id",
          userName: {
            $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"],
          },
          avatar: "$userInfo.profileImage",
          profile: "$userInfo.role",
          subProfile: "$userInfo.email",
          rating: "$rating",
          comment: "$comment",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: [
        {
          label: "Total Spent",
          value: `Rs. ${totalSpentAmount.toLocaleString()}`,
          subLabel: "On verified event orders",
        },
        {
          label: "Bookings Made",
          value: totalBookingsCount.toString(),
          subLabel: "Reserved item metrics",
        },
        {
          label: "Wishlist Saves",
          value: totalWishlistCount.toString(),
          subLabel: "Bookmarked items saved",
        },
      ],
      bookingsList,
      reviewsFeed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sync tracking user metrics pipeline payload data assets",
      error: error.message,
    });
  }
};

export const getCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Select everything except sensitive password metrics
    const customer = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (!customer) {
      const error = new Error("Customer profile document registry not found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      profile: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber, address } = req.body;

    // 1. Fetch current profile document from MongoDB
    const customerProfile = await User.findById(userId);

    if (!customerProfile) {
      const error = new Error("Customer profile document instance not found.");
      error.statusCode = 404;
      throw error;
    }

    // 2. Process Cloudinary streaming if an explicit avatar image binary payload is sent
    if (req.file) {
      const uploadedAvatarUrl = await uploadToCloudinary(req.file.buffer);
      customerProfile.profileImage = uploadedAvatarUrl;
    }

    // 3. Fall back gracefully to existing entries if fields are left blank or omitted
    customerProfile.firstName =
      firstName !== undefined ? firstName : customerProfile.firstName;
    customerProfile.lastName =
      lastName !== undefined ? lastName : customerProfile.lastName;
    customerProfile.address =
      address !== undefined ? address : customerProfile.address;

    // Maps to the exact schema root field name key descriptor: 'phoneNumber'
    customerProfile.phoneNumber =
      phoneNumber !== undefined ? phoneNumber : customerProfile.phoneNumber;

    // 4. Save updates and trigger structural validation hooks
    const updatedCustomer = await customerProfile.save();

    // Prevent hashed credentials from passing down the pipeline network
    updatedCustomer.password = undefined;

    res.status(200).json({
      success: true,
      message: "Personal profile configurations synchronized successfully!",
      profile: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};
