import express from "express";
import { upload } from "../config/cloudinary.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import {
  adminLogin,
  adminMe,
  adminLogout,
  getDashboardSummary,
  getRevenueAnalytics,
  getBookingAnalytics,
  getEventStatusDistribution,
  getVendorPerformance,
  getRecentEvents,
  getActivities,
  listEvents,
  listVenues,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  listEventCategories,
  getEventCategoryById,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
  listEventCategories as listAdminServices,
  getEventCategoryById as getAdminServiceById,
  createEventCategory as createAdminService,
  updateEventCategory as updateAdminService,
  deleteEventCategory as deleteAdminService,
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  listBookings,
  getBookingById,
  createBooking,
  listUsers,
  getUserById,
  getCalendar,
  getCalendarEvents,
  listBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  listNotifications,
  markNotificationRead,
  listMessages,
  markMessageRead,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
} from "../controllers/admin/adminController.js";

const router = express.Router();
const adminRateLimit = createRateLimit({ max: 5, windowMs: 15 * 60 * 1000, keyPrefix: "admin-auth" });

router.post("/auth/login", adminRateLimit, adminLogin);

router.use(protect);
router.use(restrictTo("admin"));

router.get("/auth/me", adminMe);
router.post("/auth/logout", adminLogout);

router.get("/dashboard/summary", getDashboardSummary);
router.get("/dashboard/revenue-analytics", getRevenueAnalytics);
router.get("/dashboard/booking-analytics", getBookingAnalytics);
router.get("/dashboard/event-status", getEventStatusDistribution);
router.get("/dashboard/vendor-performance", getVendorPerformance);
router.get("/dashboard/recent-events", getRecentEvents);
router.get("/dashboard/activities", getActivities);

router
  .route("/events")
  .get(listEvents)
  .post(createEvent);
router
  .route("/events/:id")
  .get(getEventById)
  .patch(updateEvent)
  .delete(deleteEvent);

router
  .route("/event-categories")
  .get(listEventCategories)
  .post(upload.single("image"), createEventCategory);
router
  .route("/event-categories/:id")
  .get(getEventCategoryById)
  .patch(upload.single("image"), updateEventCategory)
  .delete(deleteEventCategory);

router
  .route("/services")
  .get(listAdminServices)
  .post(upload.single("image"), createAdminService);
router
  .route("/services/:id")
  .get(getAdminServiceById)
  .patch(upload.single("image"), updateAdminService)
  .delete(deleteAdminService);

router
  .route("/vendors")
  .get(listVendors)
  .post(createVendor);
router
  .route("/vendors/:id")
  .get(getVendorById)
  .patch(updateVendor)
  .delete(deleteVendor);

router
  .route("/bookings")
  .get(listBookings)
  .post(createBooking);
router.route("/bookings/:id").get(getBookingById);

router.get("/users", listUsers);
router.get("/users/:id", getUserById);

router.get("/calendar", getCalendar);
router.get("/calendar/events", getCalendarEvents);
router.get("/venues", listVenues);

router
  .route("/blogs")
  .get(listBlogs)
  .post(upload.single("featureImage"), createBlog);
router
  .route("/blogs/:id")
  .get(getBlogById)
  .patch(upload.single("featureImage"), updateBlog)
  .delete(deleteBlog);

router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.get("/messages", listMessages);
router.patch("/messages/:id/read", markMessageRead);

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

router.get("/profile", getProfile);
router.patch("/profile", upload.single("avatar"), updateProfile);
router.patch("/profile/preferences", updatePreferences);
router.patch("/profile/password", changePassword);

export default router;
