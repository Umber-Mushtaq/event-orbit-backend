import Wishlist from "../models/Wishlist.js";
import Service from "../models/Service.js";

export const getCustomerWishlist = async (req, res, next) => {
  try {
    const authenticatedUserId = req.user.id;

    const wishlistItems = await Wishlist.find({ userId: authenticatedUserId })
      .populate({
        path: "serviceId",
        select: "title categoryId price images location averageRating vendorId",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    const formattedWishlist = wishlistItems
      .filter((item) => item.serviceId !== null)
      .map((item) => {
        const service = item.serviceId;
        return {
          id: item._id,
          serviceId: service._id,
          vendorId: service.vendorId,
          name: service.title || "Archived Service Listing",
          category: service.categoryId?.name || "General",
          rating: service.averageRating || 5,
          location: service.location || "Location Not Provided",
          price: service.price || 0,
          image:
            Array.isArray(service.images) && service.images.length > 0
              ? service.images[0]
              : "https://via.placeholder.com/400x300?text=No+Image+Available",
        };
      });

    return res.status(200).json({
      success: true,
      count: formattedWishlist.length,
      wishlistList: formattedWishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlistService = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    const authenticatedUserId = req.user.id;

    if (!serviceId) {
      const error = new Error("Target Service ID parameter is required.");
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify target listing exists in master database collections
    const serviceExists = await Service.findById(serviceId);
    if (!serviceExists) {
      const error = new Error("Target service listing no longer exists.");
      error.statusCode = 404;
      throw error;
    }

    // 2. Query to verify if the link record is already present
    const existingWishlistItem = await Wishlist.findOne({
      userId: authenticatedUserId,
      serviceId: serviceId,
    });

    if (existingWishlistItem) {
      // Action A: Record exists -> Remove (Unlike action)
      await Wishlist.findByIdAndDelete(existingWishlistItem._id);

      return res.status(200).json({
        success: true,
        isWishlisted: false,
        message: "Successfully removed from your wishlist collection.",
      });
    } else {
      // Action B: Record missing -> Create (Like action)
      await Wishlist.create({
        userId: authenticatedUserId,
        serviceId: serviceId,
      });

      return res.status(201).json({
        success: true,
        isWishlisted: true,
        message: "Successfully added to your wishlist collection.",
      });
    }
  } catch (error) {
    next(error);
  }
};
