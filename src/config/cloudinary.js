// backend/src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import sharp from "sharp"; // 🔥 Import sharp
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed!"), false);
  }
};

// Set your local multer safety catch slightly higher (e.g., 25MB)
// so large camera files can at least reach your backend to be compressed.
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

/**
 * Compresses an image asset buffer using sharp and streams it to Cloudinary
 */
export const uploadToCloudinary = async (fileBuffer) => {
  // 🔥 Optimizing step: Resize to max 1920px width (maintaining aspect ratio)
  // and convert to compressed progressive JPEG format at 80% quality level.
  const optimizedBuffer = await sharp(fileBuffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "weddingsphere/services",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    uploadStream.end(optimizedBuffer); // Send the optimized, lightweight buffer!
  });
};
