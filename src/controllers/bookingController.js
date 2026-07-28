import Booking from "../models/Bookings.js";
import mongoose from "mongoose";

// export const getBookedDates = async (req, res, next) => {
//   try {
//     const { serviceId } = req.query;

//     if (!serviceId) {
//       const error = new Error("Service ID query parameter is required.");
//       error.statusCode = 400;
//       throw error;
//     }

//     // 1. Fetch only non-cancelled bookings specifically matching this service
//     const bookings = await Booking.find({
//       serviceId,
//       bookingStatus: { $ne: "cancelled" },
//     }).select("eventDate");

//     // 2. Format dates uniformly to "YYYY-MM-DD" using strict UTC extractions
//     const bookedDates = bookings.map((booking) => {
//       const date = new Date(booking.eventDate);

//       // ✅ Using UTC methods prevents local timezone offsets from shifting dates
//       const year = date.getUTCFullYear();
//       const month = String(date.getUTCMonth() + 1).padStart(2, "0");
//       const day = String(date.getUTCDate()).padStart(2, "0");

//       return `${year}-${month}-${day}`;
//     });

//     const uniqueBookedDates = [...new Set(bookedDates)];

//     res.status(200).json({
//       success: true,
//       bookedDates: uniqueBookedDates,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getVendorBookings = async (req, res, next) => {
  try {
    // req.user.id is parsed from your authorization JWT middleware
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const bookings = await Booking.aggregate([
      {
        $match: {
          vendorId: vendorId,
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
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      // Sort: Newest requests first
      { $sort: { createdAt: -1 } },
      // Project fields to clean up mapping on frontend
      {
        $project: {
          _id: 1,
          customerName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$customer.firstName", ""] },
                  " ",
                  { $ifNull: ["$customer.lastName", ""] },
                ],
              },
            },
          },
          serviceName: { $ifNull: ["$service.title", "Archived Service"] },
          requestedDate: "$eventDate",
          guestsCount: 1,
          amount: "$totalAmount",
          status: "$bookingStatus",
          paymentStatus: 1,
          createdAt: 1,
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
    const {
      status,
      bookingStatus,
      paymentStatus,
      eventDate,
      guestsCount,
      totalAmount,
    } = req.body;
    const actorId = req.user.id; // The logged-in user's ID from the JWT token
    const requestedStatus = status || bookingStatus;

    // 1. Basic Validation
    if (
      requestedStatus &&
      !["pending", "confirmed", "completed", "cancelled"].includes(
        requestedStatus,
      )
    ) {
      const error = new Error("Invalid booking status action requested.");
      error.statusCode = 400;
      throw error;
    }

    if (
      paymentStatus &&
      !["pending", "paid", "refunded"].includes(paymentStatus)
    ) {
      const error = new Error("Invalid payment status requested.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch the booking first to see who it belongs to
    const booking = await Booking.findById(id);

    if (!booking) {
      const error = new Error("Booking request not found.");
      error.statusCode = 404;
      throw error;
    }

    // 3. Identify who is trying to change the status
    const isOwnerCustomer = booking.userId.toString() === actorId;
    const isAssignedVendor = booking.vendorId.toString() === actorId;

    // Security Guard: If they aren't the customer OR the vendor, kick them out
    if (!isOwnerCustomer && !isAssignedVendor) {
      const error = new Error(
        "Unauthorized action against this booking record.",
      );
      error.statusCode = 403;
      throw error;
    }

    // 4. Role-Based Logic Guards
    if (isOwnerCustomer && requestedStatus !== "cancelled") {
      // A customer shouldn't be able to force-approve their own booking
      const error = new Error(
        "Customers can only cancel their own booking requests.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (
      isOwnerCustomer &&
      (paymentStatus || eventDate || guestsCount || totalAmount)
    ) {
      const error = new Error("Customers cannot edit booking details.");
      error.statusCode = 403;
      throw error;
    }

    // 5. Apply Updates and Save
    if (requestedStatus) {
      booking.bookingStatus = requestedStatus;
    }

    if (isAssignedVendor) {
      if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
      }

      if (eventDate) {
        const parsedEventDate = new Date(eventDate);
        if (Number.isNaN(parsedEventDate.getTime())) {
          const error = new Error("Invalid event date requested.");
          error.statusCode = 400;
          throw error;
        }
        booking.eventDate = parsedEventDate;
      }

      if (guestsCount !== undefined) {
        const parsedGuestsCount = Number(guestsCount);
        if (!Number.isInteger(parsedGuestsCount) || parsedGuestsCount < 1) {
          const error = new Error("Guests count must be at least 1.");
          error.statusCode = 400;
          throw error;
        }
        booking.guestsCount = parsedGuestsCount;
      }

      if (totalAmount !== undefined) {
        const parsedTotalAmount = Number(totalAmount);
        if (Number.isNaN(parsedTotalAmount) || parsedTotalAmount < 0) {
          const error = new Error("Total amount cannot be negative.");
          error.statusCode = 400;
          throw error;
        }
        booking.totalAmount = parsedTotalAmount;
      }
    }

    if (requestedStatus === "cancelled" && !paymentStatus) {
      booking.paymentStatus = "refunded";
    }

    await booking.save();
    await booking.populate([
      { path: "userId", select: "firstName lastName" },
      { path: "serviceId", select: "title" },
    ]);

    // 6. Dynamic Contextual Success Message
    let successMessage = "Booking has been successfully updated.";
    if (requestedStatus === "confirmed") {
      successMessage = "Booking has been successfully confirmed.";
    } else if (requestedStatus === "cancelled") {
      successMessage = isOwnerCustomer
        ? "Booking has been successfully cancelled by the customer."
        : "Booking request has been declined by the vendor.";
    }

    const customerName = [
      booking.userId?.firstName || "",
      booking.userId?.lastName || "",
    ]
      .join(" ")
      .trim();

    res.status(200).json({
      success: true,
      message: successMessage,
      booking,
      formattedBooking: {
        _id: booking._id,
        customerName,
        serviceName: booking.serviceId?.title || "Archived Service",
        requestedDate: booking.eventDate,
        guestsCount: booking.guestsCount,
        amount: booking.totalAmount,
        status: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { serviceId, vendorId } = req.params;
    const userId = req.user.id;

    const { eventDate, guestsCount, totalAmount } = req.body;

    if (!eventDate || !guestsCount || !totalAmount) {
      const error = new Error("Missing transaction payload components.");
      error.statusCode = 400;
      throw error;
    }

    const newBooking = await Booking.create({
      userId,
      vendorId,
      serviceId,
      eventDate: new Date(eventDate),
      guestsCount,
      totalAmount,
      bookingStatus: "pending",
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Booking requested successfully!",
      booking: newBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookedDates = async (req, res, next) => {
  try {
    const { serviceId } = req.query;

    if (!serviceId) {
      const error = new Error("Service ID query parameter is required.");
      error.statusCode = 400;
      throw error;
    }

    const bookings = await Booking.find({
      serviceId,
      bookingStatus: { $ne: "cancelled" },
    }).select("eventDate serviceId");

    // Map into a key-value pair dictionary structure required by frontend state
    const bookedDatesObject = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.eventDate);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      // Since specific event names aren't in this schema layer, flag it generically
      bookedDatesObject[key] = "Booked";
    });

    res.status(200).json({
      success: true,
      bookedDates: bookedDatesObject,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const authenticatedUserId = new mongoose.Types.ObjectId(req.user.id);
    const { status } = req.query;

    const queryConditions = { userId: authenticatedUserId };

    if (status && status !== "all") {
      queryConditions.bookingStatus = status;
    }

    const bookings = await Booking.find(queryConditions)
      .populate({
        path: "serviceId",
        select: "title price priceType images location",
      })
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map((booking) => ({
      id: booking._id,
      serviceName: booking.serviceId?.title || "Archived Service Listing",
      status: booking.bookingStatus,
      date: new Date(booking.eventDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      amount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      guestsCount: booking.guestsCount,
    }));

    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookingsList: formattedBookings,
    });
  } catch (error) {
    console.error("Error inside getCustomerBookings controller:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Failed to retrieve personal booking collections.",
    });
  }
};
