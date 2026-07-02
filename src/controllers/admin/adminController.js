import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Booking from "../../models/Bookings.js";
import Service from "../../models/Service.js";
import Review from "../../models/Review.js";
import AdminEvent from "../../models/admin/Event.js";
import AdminBooking from "../../models/admin/Booking.js";
import AdminBlog from "../../models/admin/Blog.js";
import AdminNotification from "../../models/admin/Notification.js";
import AdminMessage from "../../models/admin/Message.js";
import AdminActivity from "../../models/admin/Activity.js";
import AdminSetting from "../../models/admin/Setting.js";
import AdminPreference from "../../models/admin/Preference.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import {
  applyListQuery,
  buildPagination,
  escapeRegex,
  formatTimeAgo,
  getDateRangeBounds,
  isValidCurrencyCode,
  isValidTimezone,
  monthKey,
  monthLabel,
  parseLimit,
  parsePage,
  toIsoDateOnly,
  toNumber,
} from "../../utils/adminHelpers.js";
import { generateToken } from "../../utils/token.js";
import crypto from "crypto";

const ALLOWED_CATEGORY_ICONS = [
  "tags",
  "sparkles",
  "utensils-crossed",
  "camera",
  "video",
  "music",
  "flower",
  "paintbrush",
  "briefcase",
  "grid",
];

const serializeAdmin = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  avatar: user.profileImage || "",
});

const serializeUser = (user, counts = {}) => ({
  id: user._id,
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  status:
    user.role === "vendor" ? (user.isApproved ? "Active" : "Pending") : "Active",
  role: user.role,
  events: counts.events ?? 0,
});

const toDisplayCategory = (category) => ({
  id: category._id,
  name: category.name,
  image: category.image || "",
  icon: category.icon || "tags",
  status: category.status || "Active",
  vendors: toNumber(category.vendors),
  bookings: toNumber(category.bookings),
  revenue: toNumber(category.revenue),
  listings: toNumber(category.listings),
  createdAt: category.createdAt,
});

const normalizeVendorStatus = (user) => {
  if (user.vendorStatus) return user.vendorStatus;
  if (user.role !== "vendor") return "";
  return user.isApproved ? "Approved" : "Pending";
};

const toDisplayVendor = (user) => ({
  id: user._id,
  name: `${user.firstName} ${user.lastName}`.trim(),
  category: user.vendorCategory || "",
  location: user.location || "",
  rating: toNumber(user.vendorRating),
  bookings: toNumber(user.vendorBookings),
  revenue: toNumber(user.vendorRevenue),
  status: normalizeVendorStatus(user),
  avatar: user.profileImage || "",
  createdAt: user.createdAt,
});

const ensureValidIcon = (icon) => {
  if (!ALLOWED_CATEGORY_ICONS.includes(icon)) {
    const error = new Error("Unsupported category icon.");
    error.statusCode = 400;
    throw error;
  }
};

const getUploadedImage = (req) => {
  if (req.file) return req.file;
  return null;
};

const buildVendorRows = async () => {
  const [vendors, bookings, reviews] = await Promise.all([
    User.find({ role: "vendor" }).lean(),
    Booking.find({}).lean(),
    Review.find({}).lean(),
  ]);

  return vendors.map((vendor) => {
    const vendorBookings = bookings.filter(
      (booking) => String(booking.vendorId) === String(vendor._id),
    );
    const vendorReviews = reviews.filter(
      (review) => String(review.vendorId) === String(vendor._id),
    );
    const rating =
      vendorReviews.length > 0
        ? Number(
            (
              vendorReviews.reduce((sum, review) => sum + toNumber(review.rating), 0) /
              vendorReviews.length
            ).toFixed(1),
          )
        : vendor.vendorRating ?? 0;

    const storedBookings = Number(vendor.vendorBookings);
    const storedRevenue = Number(vendor.vendorRevenue);
    const storedRating = Number(vendor.vendorRating);

    return {
      ...vendor,
      vendorRating: storedRating > 0 ? storedRating : rating,
      vendorBookings:
        Number.isFinite(storedBookings) && storedBookings > 0
          ? storedBookings
          : vendorBookings.length,
      vendorRevenue:
        Number.isFinite(storedRevenue) && storedRevenue > 0
          ? storedRevenue
          : vendorBookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0),
    };
  });
};

const buildCategoryRows = async () => {
  const [categories, vendors, services, bookings] = await Promise.all([
    Category.find({}).lean(),
    User.find({ role: "vendor" }).lean(),
    Service.find({}).lean(),
    Booking.find({}).lean(),
  ]);

  return categories.map((category) => {
    const categoryServices = services.filter(
      (service) => String(service.categoryId) === String(category._id),
    );
    const categoryVendors = vendors.filter(
      (vendor) => vendor.vendorCategory === category.name,
    );
    const categoryBookings = bookings.filter((booking) =>
      categoryServices.some((service) => String(service._id) === String(booking.serviceId)),
    );

    const storedVendors = Number(category.vendors);
    const storedBookings = Number(category.bookings);
    const storedRevenue = Number(category.revenue);
    const storedListings = Number(category.listings);

    return {
      ...category,
      vendors:
        Number.isFinite(storedVendors) && storedVendors > 0
          ? storedVendors
          : categoryVendors.length,
      bookings:
        Number.isFinite(storedBookings) && storedBookings > 0
          ? storedBookings
          : categoryBookings.length,
      revenue:
        Number.isFinite(storedRevenue) && storedRevenue > 0
          ? storedRevenue
          : categoryBookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0),
      listings:
        Number.isFinite(storedListings) && storedListings > 0
          ? storedListings
          : categoryServices.length,
    };
  });
};

const toDisplayEvent = (event) => ({
  id: event.displayId,
  name: event.name,
  category: event.category,
  date: toIsoDateOnly(event.date),
  venue: event.venue,
  status: event.status,
  attendees: event.attendees,
  revenue: event.revenue,
  organizer: event.organizerName || "",
  createdAt: event.createdAt,
});


const toDisplayBooking = (booking) => ({
  id: booking.displayId,
  event: booking.event,
  eventId: booking.eventId,
  paymentStatus: booking.paymentStatus,
  status: booking.status,
  amount: booking.amount,
  currency: booking.currency,
  date: toIsoDateOnly(booking.eventDate || booking.createdAt),
  createdAt: booking.createdAt,
});

const toDisplayBlog = (blog) => ({
  id: blog.displayId,
  title: blog.title,
  slug: blog.slug,
  category: blog.category,
  status: blog.status,
  excerpt: blog.excerpt,
  content: blog.content,
  featureImage: blog.featureImage,
  updatedAt: blog.updatedAt,
  createdAt: blog.createdAt,
});

const findByDisplayId = async (Model, value) => {
  return Model.findOne({
    $or: [{ _id: value }, { displayId: value }, { slug: value }],
  });
};

const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => {
    const value = payload?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length) {
    const error = new Error(`${missing[0]} is required.`);
    error.statusCode = 400;
    throw error;
  }
};

const fileToUrl = async (file) => {
  if (!file) return "";
  return uploadToCloudinary(file.buffer);
};

const getCalendarBounds = (view, month, date) => {
  const referenceDate = date ? new Date(date) : month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
  if (Number.isNaN(referenceDate.getTime())) return null;

  const normalizedView = String(view || "month").toLowerCase();
  if (normalizedView === "day") {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);
    return { start, end, key: toIsoDateOnly(start).slice(0, 7) };
  }

  if (normalizedView === "week") {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end, key: monthKey(start) };
  }

  const targetMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey(referenceDate);
  const [year, monthIndex] = targetMonth.split("-").map(Number);
  return {
    start: new Date(year, monthIndex - 1, 1),
    end: new Date(year, monthIndex, 0, 23, 59, 59, 999),
    key: targetMonth,
  };
};

const getGrowth = (current, previous) => {
  if (!previous) return 0;
  if (!current && !previous) return 0;
  if (!previous) return 0;
  return Number((((current - previous) / Math.max(previous, 1)) * 100).toFixed(1));
};

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  requireFields(req.body, ["email", "password"]);

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  return res.status(200).json({
    success: true,
    token: generateToken(user._id),
    admin: serializeAdmin(user),
  });
});

export const adminMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: serializeAdmin(req.user),
  });
});

export const adminLogout = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const bounds = getDateRangeBounds(range);

  const [events, vendors, bookings, users, categories] = await Promise.all([
    AdminEvent.find({}).lean(),
    buildVendorRows(),
    AdminBooking.find({}).lean(),
    User.find({}).lean(),
    buildCategoryRows(),
  ]);

  const inWindow = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= bounds.start && date <= bounds.end;
  };

  const previousInWindow = (value) => {
    const date = new Date(value);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= bounds.previousStart &&
      date <= bounds.previousEnd
    );
  };

  const currentRevenue = bookings.filter((item) => inWindow(item.createdAt)).reduce((sum, item) => sum + toNumber(item.amount), 0);
  const previousRevenue = bookings.filter((item) => previousInWindow(item.createdAt)).reduce((sum, item) => sum + toNumber(item.amount), 0);
  const currentBookings = bookings.filter((item) => inWindow(item.createdAt)).length;
  const previousBookings = bookings.filter((item) => previousInWindow(item.createdAt)).length;
  const currentVendors = vendors.filter((item) => inWindow(item.createdAt)).length;
  const previousVendors = vendors.filter((item) => previousInWindow(item.createdAt)).length;
  const currentUsers = users.filter((item) => inWindow(item.createdAt)).length;
  const previousUsers = users.filter((item) => previousInWindow(item.createdAt)).length;

  const summary = {
    totalRevenue: bookings.reduce((sum, item) => sum + toNumber(item.amount), 0),
    totalBookings: bookings.length,
    totalVendors: vendors.length,
    totalUsers: users.length,
    activeEvents: events.filter((item) => ["Upcoming", "Live"].includes(item.status)).length,
    upcomingEvents: events.filter((item) => item.status === "Upcoming").length,
    completedEvents: events.filter((item) => item.status === "Completed").length,
    pendingApprovals: vendors.filter((item) => item.vendorStatus === "Pending").length,
    growth: {
      revenue: getGrowth(currentRevenue, previousRevenue),
      bookings: getGrowth(currentBookings, previousBookings),
      vendors: getGrowth(currentVendors, previousVendors),
      users: getGrowth(currentUsers, previousUsers),
    },
  };

  return res.status(200).json({ success: true, data: summary });
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const bookings = await AdminBooking.find({}).lean();
  const buckets = new Map();

  bookings.forEach((booking) => {
    const key = monthKey(booking.createdAt);
    if (!key) return;
    const current = buckets.get(key) || { month: monthLabel(key), revenue: 0, bookings: 0 };
    current.revenue += toNumber(booking.amount);
    current.bookings += 1;
    buckets.set(key, current);
  });

  return res.status(200).json({
    success: true,
    data: [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value),
  });
});

export const getBookingAnalytics = asyncHandler(async (req, res) => {
  const bookings = await AdminBooking.find({}).lean();
  const buckets = new Map();

  bookings.forEach((booking) => {
    const key = monthKey(booking.createdAt);
    if (!key) return;
    const current = buckets.get(key) || { month: monthLabel(key), bookings: 0 };
    current.bookings += 1;
    buckets.set(key, current);
  });

  return res.status(200).json({
    success: true,
    data: [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value),
  });
});

export const getEventStatusDistribution = asyncHandler(async (req, res) => {
  const events = await AdminEvent.find({}).lean();
  const statuses = ["Upcoming", "Live", "Completed", "Cancelled"];
  const colors = {
    Upcoming: "#D4AF37",
    Live: "#F5D76E",
    Completed: "#8B6B12",
    Cancelled: "#3B3B3B",
  };

  return res.status(200).json({
    success: true,
    data: statuses.map((status) => ({
      name: status,
      value: events.filter((event) => event.status === status).length,
      color: colors[status],
    })),
  });
});

export const getVendorPerformance = asyncHandler(async (req, res) => {
  const vendors = await buildVendorRows();
  const ranked = vendors
    .map((vendor) => ({
      name: `${vendor.firstName} ${vendor.lastName}`.trim(),
      score: Math.round(
        Math.min(
          100,
          toNumber(vendor.vendorRating) * 18 +
            toNumber(vendor.vendorBookings) * 0.12 +
            Math.min(toNumber(vendor.vendorRevenue) / 10000, 12),
        ),
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return res.status(200).json({ success: true, data: ranked });
});

export const getRecentEvents = asyncHandler(async (req, res) => {
  const { search, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 5, 100);

  const events = (await AdminEvent.find({}).lean()).map(toDisplayEvent);
  const filtered = applyListQuery(events, {
    search,
    searchFields: ["id", "name", "category", "venue", "status", "organizer"],
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: filtered.items,
      pagination: filtered.pagination,
    },
  });
});

export const getActivities = asyncHandler(async (req, res) => {
  const activities = await AdminActivity.find({}).sort({ createdAt: -1 }).lean();
  if (activities.length) {
    return res.status(200).json({
      success: true,
      data: activities.map((activity) => ({
        id: activity.displayId,
        title: activity.title,
        description: activity.description,
        time: activity.time || formatTimeAgo(activity.createdAt),
        tone: activity.tone,
        icon: activity.icon,
      })),
    });
  }

  return res.status(200).json({
    success: true,
    data: [
      {
        id: "act_fallback_1",
        title: "Platform overview loaded",
        description: "Admin dashboard is ready for live data.",
        time: "just now",
        tone: "gold",
        icon: "calendar-plus",
      },
    ],
  });
});

export const listEvents = asyncHandler(async (req, res) => {
  const { search, status, category, dateFrom, dateTo, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10, 100);

  const events = (await AdminEvent.find({}).lean()).map(toDisplayEvent);
  const windowed = events.filter((item) => {
    if (!dateFrom && !dateTo) return true;
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return false;
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo)) return false;
    return true;
  });

  const filtered = applyListQuery(windowed, {
    search,
    searchFields: ["id", "name", "category", "venue", "status", "organizer"],
    filters: { status, category },
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const summary = {
    upcoming: events.filter((event) => event.status === "Upcoming").length,
    live: events.filter((event) => event.status === "Live").length,
    completed: events.filter((event) => event.status === "Completed").length,
    drafts: events.filter((event) => event.status === "Draft").length,
  };

  return res.status(200).json({
    success: true,
    data: {
      items: filtered.items,
      pagination: filtered.pagination,
      summary,
    },
  });
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await findByDisplayId(AdminEvent, req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  return res.status(200).json({ success: true, event: toDisplayEvent(event) });
});

export const createEvent = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "category", "venue", "date"]);

  const event = await AdminEvent.create({
    name: req.body.name,
    category: req.body.category,
    venue: req.body.venue,
    date: req.body.date,
    status: req.body.status || "Draft",
    attendees: toNumber(req.body.attendees),
    revenue: toNumber(req.body.revenue),
    organizerName: req.body.organizerName || "",
    organizerEmail: req.body.organizerEmail || "",
    vendorId: req.body.vendorId || "",
  });

  return res.status(201).json({
    success: true,
    message: "Event created successfully",
    event: toDisplayEvent(event),
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await findByDisplayId(AdminEvent, req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  ["name", "category", "venue", "date", "status", "organizerName", "organizerEmail", "vendorId"].forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });
  if (req.body.attendees !== undefined) event.attendees = toNumber(req.body.attendees);
  if (req.body.revenue !== undefined) event.revenue = toNumber(req.body.revenue);

  await event.save();
  return res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event: toDisplayEvent(event),
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await findByDisplayId(AdminEvent, req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  await event.deleteOne();
  return res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

const syncCategoryMetrics = async () => {
  const categories = await Category.find({}).lean();
  const vendors = await User.find({ role: "vendor" }).lean();
  const bookings = await Booking.find({}).lean();
  const services = await Service.find({}).lean();

  await Promise.all(
    categories.map(async (category) => {
      const categoryServices = services.filter(
        (service) => String(service.categoryId) === String(category._id),
      );
      const categoryVendors = vendors.filter(
        (vendor) => vendor.vendorCategory === category.name,
      );
      const categoryBookings = bookings.filter((booking) =>
        categoryServices.some(
          (service) => String(service._id) === String(booking.serviceId),
        ),
      );

      await Category.updateOne(
        { _id: category._id },
        {
          $set: {
            vendors: categoryVendors.length,
            bookings: categoryBookings.length,
            revenue: categoryBookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0),
            listings: categoryServices.length,
          },
        },
      );
    }),
  );
};

export const listEventCategories = asyncHandler(async (req, res) => {
  await syncCategoryMetrics();
  const { search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10, 100);
  const categories = (await Category.find({}).lean()).map(toDisplayCategory);

  const filtered = applyListQuery(categories, {
    search,
    searchFields: ["id", "name", "icon", "status"],
    filters: { status },
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: filtered.items,
      pagination: filtered.pagination,
      summary: {
        categories: categories.length,
        totalVendors: categories.reduce((sum, item) => sum + toNumber(item.vendors), 0),
        totalBookings: categories.reduce((sum, item) => sum + toNumber(item.bookings), 0),
        revenueGenerated: categories.reduce((sum, item) => sum + toNumber(item.revenue), 0),
      },
    },
  });
});

export const getEventCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return res.status(200).json({ success: true, category: toDisplayCategory(category) });
});

export const createEventCategory = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "icon"]);
  ensureValidIcon(req.body.icon);

  const file = req.file;
  let image = req.body.image || "";
  if (file) {
    image = await uploadToCloudinary(file.buffer);
  }
  if (!image) {
    const error = new Error("image is required.");
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.create({
    name: req.body.name,
    image,
    icon: req.body.icon,
    status: req.body.status || "Active",
  });

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    category: toDisplayCategory(category),
  });
});

export const updateEventCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.icon !== undefined) {
    ensureValidIcon(req.body.icon);
    category.icon = req.body.icon;
  }
  if (req.body.status !== undefined) category.status = req.body.status;
  if (req.body.image) category.image = req.body.image;
  if (req.file) category.image = await uploadToCloudinary(req.file.buffer);

  await category.save();
  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category: toDisplayCategory(category),
  });
});

export const deleteEventCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  await category.deleteOne();
  return res.status(200).json({ success: true, message: "Category deleted successfully" });
});

export const listVendors = asyncHandler(async (req, res) => {
  const { search, status, category, location, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10, 100);
  const vendorRows = (await buildVendorRows()).map(toDisplayVendor);

  const filtered = applyListQuery(vendorRows, {
    search,
    searchFields: ["id", "name", "category", "location", "status"],
    filters: { status, category, location },
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: filtered.items,
      pagination: filtered.pagination,
      summary: {
        totalVendors: vendorRows.length,
        approved: vendorRows.filter((vendor) => vendor.status === "Approved").length,
        pending: vendorRows.filter((vendor) => vendor.status === "Pending").length,
        suspended: vendorRows.filter((vendor) => vendor.status === "Suspended").length,
      },
    },
  });
});

export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.params.id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }
  return res.status(200).json({ success: true, vendor: toDisplayVendor(vendor) });
});

export const createVendor = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "category", "location"]);

  const rating = req.body.rating !== undefined ? toNumber(req.body.rating) : 0;
  if (rating < 0 || rating > 5) {
    const error = new Error("rating must be between 0 and 5.");
    error.statusCode = 400;
    throw error;
  }

  const parts = String(req.body.name).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Vendor";
  const lastName = parts.join(" ") || "Profile";
  const email = req.body.email
    ? String(req.body.email).toLowerCase()
    : `${String(req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "") || "vendor"}.${crypto.randomBytes(4).toString("hex")}@eventorbit.local`;
  const tempPassword = req.body.password || crypto.randomBytes(12).toString("hex");

  const vendor = await User.create({
    firstName,
    lastName,
    email,
    password: tempPassword,
    role: "vendor",
    isApproved: req.body.status === "Approved",
    vendorCategory: req.body.category,
    location: req.body.location,
    vendorStatus: req.body.status || "Pending",
    vendorRating: rating,
    vendorBookings: req.body.bookings !== undefined ? toNumber(req.body.bookings) : 0,
    vendorRevenue: req.body.revenue !== undefined ? toNumber(req.body.revenue) : 0,
    profileImage: req.body.avatar || "",
    phoneNumber: req.body.phone || "",
    businessName: req.body.businessName || "",
  });

  return res.status(201).json({
    success: true,
    message: "Vendor created successfully",
    vendor: toDisplayVendor(vendor),
  });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.params.id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }

  if (req.body.name !== undefined) {
    const parts = String(req.body.name).trim().split(/\s+/).filter(Boolean);
    vendor.firstName = parts.shift() || vendor.firstName;
    vendor.lastName = parts.join(" ") || vendor.lastName;
  }
  if (req.body.category !== undefined) vendor.vendorCategory = req.body.category;
  if (req.body.location !== undefined) vendor.location = req.body.location;
  if (req.body.rating !== undefined) {
    const rating = toNumber(req.body.rating);
    if (rating < 0 || rating > 5) {
      const error = new Error("rating must be between 0 and 5.");
      error.statusCode = 400;
      throw error;
    }
    vendor.vendorRating = rating;
  }
  if (req.body.bookings !== undefined) vendor.vendorBookings = toNumber(req.body.bookings);
  if (req.body.revenue !== undefined) vendor.vendorRevenue = toNumber(req.body.revenue);
  if (req.body.status !== undefined) {
    vendor.vendorStatus = req.body.status;
    vendor.isApproved = req.body.status === "Approved";
  }
  if (req.body.avatar !== undefined) vendor.profileImage = req.body.avatar;
  if (req.body.phone !== undefined) vendor.phoneNumber = req.body.phone;
  if (req.body.businessName !== undefined) vendor.businessName = req.body.businessName;
  if (req.body.email !== undefined) vendor.email = String(req.body.email).toLowerCase();

  await vendor.save();
  return res.status(200).json({
    success: true,
    message: "Vendor updated successfully",
    vendor: toDisplayVendor(vendor),
  });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.params.id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }
  await vendor.deleteOne();
  return res.status(200).json({ success: true, message: "Vendor deleted successfully" });
});

export const listBookings = asyncHandler(async (req, res) => {
  const { search, paymentStatus, status, dateFrom, dateTo, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10, 100);
  const bookings = (await AdminBooking.find({}).lean()).map(toDisplayBooking);

  let items = bookings;
  if (search) {
    const normalized = String(search).trim().toLowerCase();
    items = items.filter((booking) =>
      [booking.id, booking.event, booking.paymentStatus, booking.status, booking.currency].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized),
      ),
    );
  }
  if (paymentStatus && paymentStatus !== "all") {
    items = items.filter((booking) => booking.paymentStatus === paymentStatus);
  }
  if (status && status !== "all") {
    items = items.filter((booking) => booking.status === status);
  }
  if (dateFrom || dateTo) {
    items = items.filter((booking) => {
      const value = booking.date ? new Date(booking.date) : null;
      if (!value || Number.isNaN(value.getTime())) return false;
      if (dateFrom && value < new Date(dateFrom)) return false;
      if (dateTo && value > new Date(dateTo)) return false;
      return true;
    });
  }

  const sorted = applyListQuery(items, {
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const summary = {
    totalBookings: bookings.length,
    confirmed: bookings.filter((booking) => booking.status === "Confirmed").length,
    pending: bookings.filter((booking) => booking.status === "Pending").length,
    cancelled: bookings.filter((booking) => booking.status === "Cancelled").length,
  };

  return res.status(200).json({
    success: true,
    data: {
      items: sorted.items,
      pagination: sorted.pagination,
      summary,
    },
  });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await findByDisplayId(AdminBooking, req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  return res.status(200).json({ success: true, booking: toDisplayBooking(booking) });
});

export const createBooking = asyncHandler(async (req, res) => {
  if (!req.body.event && !req.body.eventId) {
    const error = new Error("event or eventId is required.");
    error.statusCode = 400;
    throw error;
  }
  requireFields(req.body, ["paymentStatus", "amount"]);

  let eventDate = req.body.eventDate;
  if (!eventDate && req.body.eventId) {
    const linkedEvent = await findByDisplayId(AdminEvent, req.body.eventId);
    if (linkedEvent) {
      eventDate = linkedEvent.date;
      if (!req.body.event) req.body.event = linkedEvent.name;
    }
  }

  const booking = await AdminBooking.create({
    eventId: req.body.eventId || "",
    event: req.body.event,
    paymentStatus: req.body.paymentStatus,
    status: req.body.status || "Pending",
    amount: toNumber(req.body.amount),
    currency: req.body.currency || "USD",
    eventDate: eventDate || undefined,
    userId: req.body.userId || undefined,
  });

  return res.status(201).json({
    success: true,
    message: "Booking created successfully",
    booking: toDisplayBooking(booking),
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search, status, role, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 10, 100);
  const users = await User.find({}).lean();
  const bookings = await AdminBooking.find({}).lean();
  const events = await AdminEvent.find({}).lean();

  const rows = users.map((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const eventCount = events.filter((event) => {
      if (event.organizerUserId) {
        return String(event.organizerUserId) === String(user._id);
      }
      if (user.email && event.organizerEmail) {
        return String(event.organizerEmail).toLowerCase() === String(user.email).toLowerCase();
      }
      return event.organizerName === fullName;
    }).length;

    const bookingCount = bookings.filter((booking) => String(booking.userId || "") === String(user._id)).length;

    return {
      id: user._id,
      name: fullName,
      email: user.email,
      status:
        user.role === "vendor" ? (user.isApproved ? "Active" : "Pending") : "Active",
      role: user.role,
      events: eventCount || bookingCount,
      createdAt: user.createdAt,
    };
  });

  let items = rows;
  if (search) {
    const normalized = String(search).trim().toLowerCase();
    items = items.filter((user) =>
      [user.id, user.name, user.email].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized),
      ),
    );
  }
  if (status && status !== "all") {
    items = items.filter((user) => user.status === status);
  }
  if (role && role !== "all") {
    items = items.filter((user) => user.role === role);
  }

  const sorted = applyListQuery(items, { sortBy, sortOrder, page, limit });

  const summary = {
    totalUsers: rows.length,
    active: rows.filter((user) => user.status === "Active").length,
    newThisMonth: rows.filter((user) => {
      const created = new Date(user.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    avgEventsPerUser:
      rows.length === 0
        ? 0
        : Number((rows.reduce((sum, user) => sum + toNumber(user.events), 0) / rows.length).toFixed(1)),
  };

  return res.status(200).json({
    success: true,
    data: {
      items: sorted.items.map(({ createdAt, ...item }) => item),
      pagination: sorted.pagination,
      summary,
    },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const bookings = await AdminBooking.find({ userId: user._id }).lean();
  const events = await AdminEvent.find({ organizerUserId: user._id }).lean();

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      status: user.role === "vendor" ? (user.isApproved ? "Active" : "Pending") : "Active",
      avatar: user.profileImage || "",
      phone: user.phoneNumber || "",
      events: events.length || bookings.length,
    },
  });
});

export const getCalendar = asyncHandler(async (req, res) => {
  const view = String(req.query.view || "month").toLowerCase();
  const bounds = getCalendarBounds(view, req.query.month, req.query.date);
  if (!bounds) {
    return res.status(400).json({ success: false, message: "Invalid date parameter" });
  }

  const events = await AdminEvent.find({
    date: { $gte: bounds.start, $lte: bounds.end },
  }).lean();

  const dayMap = new Map();
  events.forEach((event) => {
    const date = toIsoDateOnly(event.date);
    if (!date) return;
    const current = dayMap.get(date) || [];
    current.push({
      id: event.displayId,
      title: event.name,
      status: event.status,
    });
    dayMap.set(date, current);
  });

  const start = new Date(bounds.start);
  const end = new Date(bounds.end);
  const days = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = toIsoDateOnly(cursor);
    days.push({
      date: key,
      label: cursor.getDate(),
      events: dayMap.get(key) || [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return res.status(200).json({
    success: true,
    data: {
      month: bounds.key,
      view,
      days,
    },
  });
});

export const getCalendarEvents = asyncHandler(async (req, res) => {
  const events = await AdminEvent.find({}).sort({ date: 1 }).lean();
  return res.status(200).json({
    success: true,
    data: events.map((event) => ({
      date: toIsoDateOnly(event.date),
      title: event.name,
    })),
  });
});

export const listBlogs = asyncHandler(async (req, res) => {
  const { search, category, status, sortBy = "updatedAt", sortOrder = "desc" } = req.query;
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 12, 100);
  const blogs = (await AdminBlog.find({}).lean()).map(toDisplayBlog);

  const filtered = applyListQuery(blogs, {
    search,
    searchFields: ["id", "title", "slug", "category", "status", "excerpt", "content"],
    filters: { category, status },
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return res.status(200).json({
    success: true,
    data: {
      items: filtered.items,
      pagination: filtered.pagination,
    },
  });
});

export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await findByDisplayId(AdminBlog, req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  return res.status(200).json({ success: true, blog: toDisplayBlog(blog) });
});

export const createBlog = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "slug", "category", "content"]);

  const slug = String(req.body.slug).toLowerCase().trim();
  const existing = await AdminBlog.findOne({ slug });
  if (existing) {
    const error = new Error("Slug must be unique.");
    error.statusCode = 400;
    throw error;
  }

  let featureImage = req.body.featureImage || "";
  if (req.file) featureImage = await fileToUrl(req.file);
  if (!featureImage && req.body.featureImage && /^https?:\/\//i.test(req.body.featureImage)) {
    featureImage = req.body.featureImage;
  }
  if (!featureImage) {
    const error = new Error("featureImage is required.");
    error.statusCode = 400;
    throw error;
  }

  const blog = await AdminBlog.create({
    title: req.body.title,
    slug,
    category: req.body.category,
    status: req.body.status || "Draft",
    excerpt: req.body.excerpt || "",
    content: req.body.content,
    featureImage,
    authorAdminId: req.user?.id,
  });

  return res.status(201).json({
    success: true,
    message: "Blog created successfully",
    blog: toDisplayBlog(blog),
  });
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await findByDisplayId(AdminBlog, req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  if (req.body.slug !== undefined) {
    const nextSlug = String(req.body.slug).toLowerCase().trim();
    const existing = await AdminBlog.findOne({ slug: nextSlug, _id: { $ne: blog._id } });
    if (existing) {
      const error = new Error("Slug must be unique.");
      error.statusCode = 400;
      throw error;
    }
    blog.slug = nextSlug;
  }

  ["title", "category", "status", "excerpt", "content"].forEach((field) => {
    if (req.body[field] !== undefined) blog[field] = req.body[field];
  });

  if (req.body.featureImage && /^https?:\/\//i.test(req.body.featureImage)) {
    blog.featureImage = req.body.featureImage;
  }
  if (req.file) blog.featureImage = await fileToUrl(req.file);

  await blog.save();
  return res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog: toDisplayBlog(blog),
  });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await findByDisplayId(AdminBlog, req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  await blog.deleteOne();
  return res.status(200).json({ success: true, message: "Blog deleted successfully" });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await AdminNotification.find({}).sort({ createdAt: -1 }).lean();
  const fallback = [
    {
      id: "ntf_fallback_1",
      title: "Pending vendor approval",
      description: "3 vendors are waiting for review.",
      time: "5 min ago",
      read: false,
    },
  ];

  return res.status(200).json({
    success: true,
    data: (notifications.length
      ? notifications.map((notification) => ({
          id: notification.displayId,
          title: notification.title,
          description: notification.description,
          time: notification.time || formatTimeAgo(notification.createdAt),
          read: notification.read,
        }))
      : fallback),
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await findByDisplayId(AdminNotification, req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  notification.read = true;
  await notification.save();
  return res.status(200).json({ success: true, message: "Notification marked as read" });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await AdminMessage.find({}).sort({ createdAt: -1 }).lean();
  const fallback = [
    {
      id: "msg_fallback_1",
      title: "Nadia from Royal Bloom",
      description: "Can we revise the gallery pricing?",
      time: "7 min ago",
      read: false,
    },
  ];

  return res.status(200).json({
    success: true,
    data: (messages.length
      ? messages.map((message) => ({
          id: message.displayId,
          title: message.title,
          description: message.description,
          time: message.time || formatTimeAgo(message.createdAt),
          read: message.read,
        }))
      : fallback),
  });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await findByDisplayId(AdminMessage, req.params.id);
  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }
  message.read = true;
  await message.save();
  return res.status(200).json({ success: true, message: "Message marked as read" });
});

export const getSettings = asyncHandler(async (req, res) => {
  const [settings, categories, users] = await Promise.all([
    AdminSetting.findOne({ key: "global" }).lean(),
    Category.find({}).lean(),
    User.find({}).lean(),
  ]);

  const platform = settings || {
    currency: "USD",
    timezone: "Asia/Kolkata",
    autoApproveCategories: false,
    themeModes: ["Light", "Dark"],
  };

  return res.status(200).json({
    success: true,
    data: {
      roles: ["Super Admin", "Admin", "Vendor", "User", "Viewer"],
      team: {
        totalMembers: users.length,
        admins: users.filter((user) => user.role === "admin").length,
        staff: users.filter((user) => user.role !== "admin").length,
      },
      categories: {
        total: categories.length,
        hidden: categories.filter((category) => category.status !== "Active").length,
        autoApprove: Boolean(platform.autoApproveCategories),
      },
      platform: {
        currency: platform.currency,
        timezone: platform.timezone,
        themeModes: platform.themeModes || ["Light", "Dark"],
      },
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  if (req.body.currency !== undefined && !isValidCurrencyCode(req.body.currency)) {
    const error = new Error("currency must be a valid ISO currency code.");
    error.statusCode = 400;
    throw error;
  }
  if (req.body.timezone !== undefined && !isValidTimezone(req.body.timezone)) {
    const error = new Error("timezone must be a valid IANA timezone.");
    error.statusCode = 400;
    throw error;
  }
  if (req.body.autoApproveCategories !== undefined && typeof req.body.autoApproveCategories !== "boolean") {
    const error = new Error("autoApproveCategories must be boolean.");
    error.statusCode = 400;
    throw error;
  }

  const updates = {};
  if (req.body.currency !== undefined) updates.currency = req.body.currency;
  if (req.body.timezone !== undefined) updates.timezone = req.body.timezone;
  if (req.body.autoApproveCategories !== undefined) {
    updates.autoApproveCategories = req.body.autoApproveCategories;
  }
  if (Array.isArray(req.body.themeModes)) {
    updates.themeModes = req.body.themeModes;
  }

  const settings = await AdminSetting.findOneAndUpdate(
    { key: "global" },
    {
      $set: updates,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return res.status(200).json({
    success: true,
    message: "Settings updated successfully",
    data: settings,
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const preferences = await AdminPreference.findOne({ adminId: req.user.id }).lean();
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.profileImage || "",
      phone: req.user.phoneNumber || "",
      preferences: preferences || {
        theme: "Dark",
        sidebarCollapsed: false,
        language: "en",
        notificationsEnabled: true,
      },
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (req.body.email && req.body.email !== req.user.email) {
    const existing = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existing && String(existing._id) !== String(req.user._id)) {
      const error = new Error("Email is already in use.");
      error.statusCode = 400;
      throw error;
    }
  }

  ["firstName", "lastName", "email", "phone"].forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field === "phone" ? "phoneNumber" : field] = req.body[field];
    }
  });

  if (req.body.avatar) {
    req.user.profileImage = req.body.avatar;
  }
  if (req.file) {
    req.user.profileImage = await uploadToCloudinary(req.file.buffer);
  }

  await req.user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    admin: serializeAdmin(req.user),
  });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await AdminPreference.findOneAndUpdate(
    { adminId: req.user.id },
    {
      $set: {
        theme: req.body.theme,
        sidebarCollapsed: req.body.sidebarCollapsed,
        language: req.body.language,
        notificationsEnabled: req.body.notificationsEnabled,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: preferences,
  });
});
