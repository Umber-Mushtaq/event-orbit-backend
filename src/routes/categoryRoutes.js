import express from "express";
import {
  getAllCategories,
  getCategoryDetail,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/categoryDetail/:id", getCategoryDetail);

export default router;
