import Service from "../models/Service.js";
import mongoose from "mongoose";

export const getVendorServiceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate("categoryId", "name")
      .populate("vendorId", "firstName lastName profileImage companyName");

    if (!service) {
      const error = new Error(
        "The requested wedding service could not be found.",
      );
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
};

// export const getAllServices = async (req, res) => {
//   try {
//     const { category, search } = req.query;

//     // 1. Establish your base criteria filter mapping condition
//     let queryCondition = { isActive: true };

//     // 2. 🌟 CRITICAL FIX: Safe type handling for Category Filters to eliminate CastErrors
//     if (category && category !== "all") {
//       // Check if the passed category query value is a valid 24-character hexadecimal Mongoose ObjectId
//       const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(category);

//       if (isValidObjectId) {
//         // If it's a valid ObjectId hex string, query using the schema relationship field path reference
//         queryCondition.categoryId = category;
//       } else {
//         // If it's a plain string text name (e.g., "Catering"), match case-insensitively
//         // against the custom string path field present on your document layout!
//         queryCondition.category = { $regex: new RegExp(`^${category}$`, "i") };
//       }
//     }

//     // 3. Handle text searches seamlessly
//     if (search) {
//       queryCondition.$text = { $search: search };
//     }

//     // 4. Retrieve database records safely
//     // Note: We leave out .populate() on vendorId temporarily to prevent nested casting breaks
//     // if any seed records have missing/corrupted referenced records.
//     const services = await Service.find(queryCondition).sort({ createdAt: -1 });

//     // 5. Structure payload fields to match your React components
//     const formattedServices = services.map((service) => ({
//       id: service._id,
//       title: service.title,
//       description: service.description || "",
//       price: service.price || 0,
//       priceType: service.priceType || "fixed",
//       location: service.location || "Location Not Specified",
//       images:
//         Array.isArray(service.images) && service.images.length > 0
//           ? service.images
//           : [],
//       averageRating: service.averageRating || 5,
//       totalReviews: service.totalReviews || 0,
//       category: service.category || "Event Service",
//       vendor: {
//         name: "Premium Provider",
//         businessName: "EventOrbit Pro Vendor",
//         avatar: "",
//       },
//     }));

//     return res.status(200).json({
//       success: true,
//       count: formattedServices.length,
//       data: formattedServices,
//     });
//   } catch (error) {
//     // Gracefully handles failure context responses instead of letting your app process freeze
//     return res.status(500).json({
//       success: false,
//       message:
//         "Server query processing failed within the marketplace aggregator engine.",
//       error: error.message,
//     });
//   }
// };

export const getAllServices = async (req, res) => {
  try {
    const { category, location, minPrice, maxPrice, date, search } = req.query;

    let queryCondition = { isActive: true };
    if (category && category !== "all" && category !== "") {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      if (isValidObjectId) {
        queryCondition.categoryId = category;
      }
    }
    if (location && location.trim() !== "" && location !== "all") {
      queryCondition.location = { $regex: new RegExp(location, "i") };
    }

    if ((minPrice && minPrice !== "") || (maxPrice && maxPrice !== "")) {
      queryCondition.price = {};

      if (minPrice && minPrice !== "") {
        queryCondition.price.$gte = Number(minPrice);
      }

      if (maxPrice && maxPrice !== "") {
        queryCondition.price.$lte = Number(maxPrice);
      }
    }
    if (date && date.trim() !== "" && date !== "all") {
      const parsedDate = new Date(date);

      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setUTCHours(0, 0, 0, 0);

        queryCondition.createdAt = { $gte: parsedDate };
      }
    }

    if (search && search.trim() !== "") {
      queryCondition.$text = { $search: search };
    }

    const services = await Service.find(queryCondition)
      .populate("vendorId")
      .sort({ createdAt: -1 });

    const formattedServices = services.map((service) => ({
      id: service._id,
      title: service.title,
      description: service.description || "",
      price: service.price || 0,
      priceType: service.priceType || "fixed",
      location: service.location || "Location Not Specified",
      images:
        Array.isArray(service.images) && service.images.length > 0
          ? service.images
          : [],
      averageRating: service.averageRating || 5,
      totalReviews: service.totalReviews || 0,
      createdAt: service.createdAt,
      vendor: service.vendorId
        ? {
            id: service.vendorId._id,
            fullName: service.vendorId.fullName,
            businessName:
              service.vendorId.businessName || "EventOrbit Pro Vendor",
            profileImage: service.vendorId.profileImage || "",
          }
        : {
            name: "Premium Provider",
            businessName: "EventOrbit Pro Vendor",
            avatar: "",
          },
    }));

    return res.status(200).json({
      success: true,
      count: formattedServices.length,
      data: formattedServices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Server query processing failed within the marketplace aggregator engine.",
      error: error.message,
    });
  }
};

export const getServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Service ID format." });
    }

    const serviceData = await Service.aggregate([
      // 1. Target the specific service listing
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // 2. Lookup Vendor information
      {
        $lookup: {
          from: "users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },

      // 3. Lookup Reviews associated with this service
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "serviceId",
          as: "reviews",
        },
      },

      // 4. 🌟 CRITICAL FIX: Unwind, Lookup Reviewers, and Reassemble nested data
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reviews.userId",
          foreignField: "_id",
          as: "reviews.author",
        },
      },
      {
        $unwind: { path: "$reviews.author", preserveNullAndEmptyArrays: true },
      },

      // 5. Group the unwound records back into a clean service array structure
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          price: { $first: "$price" },
          priceType: { $first: "$priceType" },
          location: { $first: "$location" },
          images: { $first: "$images" },
          vendor: { $first: "$vendor" },
          reviews: {
            $push: {
              $cond: {
                if: { $gt: ["$reviews._id", null] }, // Keeps list clean if no reviews exist
                then: {
                  _id: "$reviews._id",
                  rating: "$reviews.rating",
                  comment: "$reviews.comment",
                  createdAt: "$reviews.createdAt",
                  // Injecting populated user data fields cleanly
                  authorName: {
                    $concat: [
                      { $ifNull: ["$reviews.author.firstName", "Anonymous"] },
                      " ",
                      { $ifNull: ["$reviews.author.lastName", "User"] },
                    ],
                  },
                  profileImage: {
                    $ifNull: ["$reviews.author.profileImage", ""],
                  },
                },
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          priceType: 1,
          location: 1,
          images: 1,
          vendorIds: 1,
          averageRating: { $ifNull: [{ $avg: "$reviews.rating" }, 5] },
          vendor: {
            _id: "$vendor._id",
            fullName: {
              $concat: ["$vendor.firstName", " ", "$vendor.lastName"],
            },
            businessName: "$vendor.businessName",
            businessDescription: "$vendor.businessDescription",
            vendorBio: "$vendor.vendorBio",
            profileImage: "$vendor.profileImage",
            email: "$vendor.email",
            phoneNumber: "$vendor.phoneNumber",
            whatsappNumber: "$vendor.whatsappNumber",
            instagram: "$vendor.instagram",
            linkedin: "$vendor.linkedin",
            facebook: "$vendor.facebook",
            website: "$vendor.website",
            createdAt: "$vendor.createdAt",
          },
          reviews: 1,
        },
      },
    ]);

    if (!serviceData || serviceData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Service listing not found." });
    }

    res.status(200).json({ success: true, data: serviceData[0] });
  } catch (error) {
    console.error("Error fetching service details:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server matrix error." });
  }
};
