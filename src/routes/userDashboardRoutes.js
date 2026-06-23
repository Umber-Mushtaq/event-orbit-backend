import express from "express";
import { getUserDashboardOverview } from "../controllers/userDashboardController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getUserDashboardOverview);

export default router;
