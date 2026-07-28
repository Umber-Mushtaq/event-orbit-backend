import express from "express";
import {
  getVendorServiceDetails,
  getAllServices,
  getServiceDetail,
} from "../controllers/servicesController.js";

const router = express.Router();

router.get("/getAllServices", getAllServices);
router.get("/:id", getVendorServiceDetails);
router.get("/categoryDetail/:id", getServiceDetail);
router.get("/serviceDetail/:id", getServiceDetail);

export default router;
