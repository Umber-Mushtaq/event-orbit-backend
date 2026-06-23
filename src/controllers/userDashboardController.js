import Booking from "../models/Bookings.js";
import Review from "../models/Review.js";
import Wishlist from "../models/Wishlist.js";
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
