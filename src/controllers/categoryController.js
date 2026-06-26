import Category from "../models/Category.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    const formattedCategories = categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
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
