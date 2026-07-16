import AdminBlog from "../models/admin/Blog.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { buildPagination, escapeRegex, parseLimit, parsePage } from "../utils/adminHelpers.js";

const stripBlogHtml = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const estimateReadTime = (content) => {
  const words = stripBlogHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const getAuthorName = (blog) => {
  const author = blog.authorAdminId || {};
  const name = `${author.firstName || ""} ${author.lastName || ""}`.trim();
  return name || "Editorial Team";
};

const toPublicBlog = (blog) => ({
  id: blog.displayId,
  title: blog.title,
  slug: blog.slug,
  category: blog.category,
  excerpt:
    blog.excerpt || stripBlogHtml(blog.content).slice(0, 180).trim(),
  content: blog.content,
  featureImage: blog.featureImage,
  authorName: getAuthorName(blog),
  authorAvatar: blog.authorAdminId?.profileImage || "",
  readTime: estimateReadTime(blog.content),
  publishedAt: blog.createdAt || blog.updatedAt,
  updatedAt: blog.updatedAt,
  createdAt: blog.createdAt,
});

export const listPublishedBlogs = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();
  const page = parsePage(req.query.page, 1);
  const limit = parseLimit(req.query.limit, 6, 100);

  const query = { status: "Published" };

  if (category) {
    query.category = category;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { title: pattern },
      { slug: pattern },
      { category: pattern },
      { excerpt: pattern },
      { content: pattern },
    ];
  }

  const blogs = await AdminBlog.find(query)
    .sort({ createdAt: -1, updatedAt: -1 })
    .populate("authorAdminId", "firstName lastName profileImage")
    .lean();

  const items = blogs.map(toPublicBlog);
  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);

  return res.status(200).json({
    success: true,
    data: {
      items: pagedItems,
      pagination: buildPagination(items.length, page, limit),
    },
  });
});

export const getPublishedBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await AdminBlog.findOne({
    slug: req.params.slug,
    status: "Published",
  })
    .populate("authorAdminId", "firstName lastName profileImage")
    .lean();

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  return res.status(200).json({
    success: true,
    blog: toPublicBlog(blog),
  });
});
