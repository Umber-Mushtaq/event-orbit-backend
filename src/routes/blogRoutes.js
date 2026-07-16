import express from "express";
import { getPublishedBlogBySlug, listPublishedBlogs } from "../controllers/blogController.js";

const router = express.Router();

router.get("/", listPublishedBlogs);
router.get("/:slug", getPublishedBlogBySlug);

export default router;
