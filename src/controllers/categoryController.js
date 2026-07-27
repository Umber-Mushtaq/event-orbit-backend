import mongoose from "mongoose";
import Category from "../models/Category.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    const formattedCategories = categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      image: cat.image,
      icon: cat.icon || "tags",
      status: cat.status || "Active",
      vendors: cat.vendors || 0,
      bookings: cat.bookings || 0,
      revenue: cat.revenue || 0,
      listings: cat.listings || 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server failed to retrieve marketplace service categories.",
      error: error.message,
    });
  }
};

const normalizeVendor = (vendor) => {
  if (!vendor) return null;

  const firstName = vendor.firstName || "";
  const lastName = vendor.lastName || "";

  return {
    _id: vendor._id,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ").trim(),
    businessName: vendor.businessName || "",
    businessDescription: vendor.businessDescription || "",
    vendorBio: vendor.vendorBio || "",
    profileImage: vendor.profileImage || "",
    email: vendor.email || "",
    phoneNumber: vendor.phoneNumber || "",
    whatsappNumber: vendor.whatsappNumber || "",
    address: vendor.address || "",
    location: vendor.location || "",
    city: vendor.city || "",
    country: vendor.country || "",
    instagram: vendor.instagram || "",
    linkedin: vendor.linkedin || "",
    facebook: vendor.facebook || "",
    website: vendor.website || "",
    isApproved: Boolean(vendor.isApproved),
    vendorCategory: vendor.vendorCategory || "",
    vendorRating: vendor.vendorRating || 0,
    yearsOfExperience: vendor.yearsOfExperience || 0,
    status: vendor.status || "",
    createdAt: vendor.createdAt,
  };
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const vendorSelect =
  "firstName lastName profileImage businessName businessDescription vendorBio email phoneNumber whatsappNumber address location city country instagram linkedin facebook website isApproved vendorCategory vendorRating yearsOfExperience status createdAt";

export const getCategoryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    let resolvedCategoryId = id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Category ID format." });
    }

    let category = await Category.findById(resolvedCategoryId).lean();

    if (!category) {
      const matchedService = await Service.findById(resolvedCategoryId)
        .select("categoryId")
        .lean();

      if (matchedService?.categoryId && mongoose.Types.ObjectId.isValid(matchedService.categoryId)) {
        resolvedCategoryId = String(matchedService.categoryId);
        category = await Category.findById(resolvedCategoryId).lean();
      }
    }

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const categoryServices = await Service.find({
      categoryId: resolvedCategoryId,
      isActive: true,
    })
      .populate("vendorId", vendorSelect)
      .populate("vendorIds", vendorSelect)
      .sort({ createdAt: -1 });

    const profileVendors = await User.find({
      role: "vendor",
      isApproved: true,
      vendorCategory: { $regex: new RegExp(`^${escapeRegex(category.name)}$`, "i") },
    })
      .select(vendorSelect)
      .lean();

    const vendorMap = new Map();

    for (const service of categoryServices) {
      const vendorsFromService = [
        service.vendorId,
        ...(Array.isArray(service.vendorIds) ? service.vendorIds : []),
      ].filter(Boolean);

      for (const vendor of vendorsFromService) {
        const normalized = normalizeVendor(vendor);
        if (normalized?.isApproved && !vendorMap.has(String(normalized._id))) {
          vendorMap.set(String(normalized._id), normalized);
        }
      }
    }

    for (const vendor of profileVendors) {
      const normalized = normalizeVendor(vendor);
      if (normalized && !vendorMap.has(String(normalized._id))) {
        vendorMap.set(String(normalized._id), normalized);
      }
    }

    const vendors = Array.from(vendorMap.values()).sort((a, b) => {
      const ratingDiff = Number(b.vendorRating || 0) - Number(a.vendorRating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: category._id,
        name: category.name,
        description: category.description || "",
        image: category.image || "",
        icon: category.icon || "tags",
        status: category.status || "Active",
        vendors: vendors.length,
        bookings: category.bookings || 0,
        revenue: category.revenue || 0,
        listings: category.listings || categoryServices.length,
        relatedVendors: vendors,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server failed to retrieve category details.",
      error: error.message,
    });
  }
};
