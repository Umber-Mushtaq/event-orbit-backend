import Booking from "../models/Bookings.js";
import mongoose from "mongoose";

export const getBookedDates = async (req, res, next) => {
  try {
    const { serviceId } = req.query;

    if (!serviceId) {
      const error = new Error("Service ID query parameter is required.");
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch only non-cancelled bookings specifically matching this service
    const bookings = await Booking.find({
      serviceId,
      bookingStatus: { $ne: "cancelled" },
    }).select("eventDate");

    // 2. Format dates uniformly to "YYYY-MM-DD" using strict UTC extractions
    const bookedDates = bookings.map((booking) => {
      const date = new Date(booking.eventDate);

      // ✅ Using UTC methods prevents local timezone offsets from shifting dates
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    });

    const uniqueBookedDates = [...new Set(bookedDates)];

    res.status(200).json({
      success: true,
      bookedDates: uniqueBookedDates,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorBookings = async (req, res, next) => {
  try {
    // req.user.id is parsed from your authorization JWT middleware
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const bookings = await Booking.aggregate([
      {
        $match: {
          vendorId: vendorId,
          // Only fetch requests awaiting vendor attention
          bookingStatus: { $in: ["pending", "confirmed"] },
        },
      },
      // Join User collection to extract Customer Details
      {
        $lookup: {
          from: "users", // ensure this matches your MongoDB users collection name
          localField: "userId",
          foreignField: "_id",
          as: "customer",
        },
      },
      // Join Service collection to extract Service Title
      {
        $lookup: {
          from: "services", // ensure this matches your MongoDB services collection name
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      // Flatten lookup arrays
      { $unwind: "$customer" },
      { $unwind: "$service" },
      // Sort: Newest requests first
      { $sort: { createdAt: -1 } },
      // Project fields to clean up mapping on frontend
      {
        $project: {
          _id: 1,
          customerName: {
            $concat: ["$customer.firstName", " ", "$customer.lastName"],
          },
          serviceName: "$service.title",
          requestedDate: "$eventDate",
          amount: "$totalAmount",
          status: "$bookingStatus",
          paymentStatus: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expects "confirmed" or "cancelled"

    if (!["confirmed", "cancelled"].includes(status)) {
      const error = new Error("Invalid booking status action requested.");
      error.statusCode = 400;
      throw error;
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, vendorId: req.user.id }, // Security constraint block
      { bookingStatus: status },
      { new: true, runValidators: true },
    );

    if (!booking) {
      const error = new Error(
        "Booking request not found or unauthorized action.",
      );
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `Booking has been successfully ${status === "confirmed" ? "confirmed" : "declined"}.`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};
