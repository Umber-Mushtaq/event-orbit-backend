import Review from "../models/Review.js";

import mongoose from "mongoose";

export const getServiceReviews = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const reviews = await Review.find({ serviceId })
      .populate("userId", "firstName lastName profileImage")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorDashboardReviews = async (req, res, next) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const { ratingFilter } = req.query; // 'all', '5', '4', '3_less'

    // --- STEP 1: CALCULATE SUMMARY STATISTICS ---
    const statsPipeline = [
      { $match: { vendorId: vendorId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          threeStarsOrLess: {
            $sum: { $cond: [{ $lte: ["$rating", 3] }, 1, 0] },
          },
        },
      },
    ];

    const statsResult = await Review.aggregate(statsPipeline);

    // Fallback default values if no reviews exist yet
    const stats = statsResult[0] || {
      averageRating: 0,
      totalReviews: 0,
      fiveStars: 0,
      fourStars: 0,
      threeStarsOrLess: 0,
    };

    // --- STEP 2: BUILD DYNAMIC FILTER FOR REVIEW LIST ---
    let reviewMatchCriteria = { vendorId: vendorId };

    if (ratingFilter === "5") {
      reviewMatchCriteria.rating = 5;
    } else if (ratingFilter === "4") {
      reviewMatchCriteria.rating = 4;
    } else if (ratingFilter === "3_less") {
      reviewMatchCriteria.rating = { $lte: 3 };
    }

    // --- STEP 3: AGGREGATE REVIEW STREAM ---
    const reviews = await Review.aggregate([
      { $match: reviewMatchCriteria },
      // Join User collection to get client name and avatar image profile url
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "reviewer",
        },
      },
      // Join Service collection to fetch which asset package they are reviewing
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$reviewer" },
      { $unwind: "$service" },
      { $sort: { createdAt: -1 } }, // Newest first
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          date: "$createdAt",
          userName: {
            $concat: ["$reviewer.firstName", " ", "$reviewer.lastName"],
          },
          avatar: "$reviewer.avatarUrl", // Make sure this matches your schema property naming
          serviceName: "$service.title",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        averageRating: Number(stats.averageRating.toFixed(1)),
        totalReviews: stats.totalReviews,
        fiveStars: stats.fiveStars,
        fourStars: stats.fourStars,
        threeStarsOrLess: stats.threeStarsOrLess,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
