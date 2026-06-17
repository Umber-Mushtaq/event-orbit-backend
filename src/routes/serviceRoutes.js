import express from "express";
import { getPublicServiceDetails } from "../controllers/servicesController.js";

const router = express.Router();

// Public route to view individual service records
router.get("/:id", getPublicServiceDetails);

export default router;
