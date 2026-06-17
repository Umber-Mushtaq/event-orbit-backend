import Service from "../models/Service.js";

export const getPublicServiceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate("categoryId", "name")
      .populate("vendorId", "firstName lastName profileImage companyName");

    if (!service) {
      const error = new Error(
        "The requested wedding service could not be found.",
      );
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
};
