import multer from "multer";
import path from "path";
import { uploadMulterFileToS3, uploadBase64ToS3 } from "../../utils/s3-upload.js";

// Configure multer for image uploads - use memory storage for S3
const storage = multer.memoryStorage();

export const uploadImage = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload image to S3 and return public URL
export const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to S3
    const imageUrl = await uploadMulterFileToS3(req.file, "images");
    
    console.log("[Image Upload] Image uploaded to S3:", imageUrl);

    return res.json({
      success: true,
      imageUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("[Image Upload] Error:", error);
    return res.status(500).json({ message: "Image upload failed", error: error.message });
  }
};

// Helper function to convert base64 to file and upload to S3
export const uploadBase64Image = async (base64String) => {
  try {
    // Upload base64 image to S3
    const imageUrl = await uploadBase64ToS3(base64String);
    console.log("[Base64 Upload] Image uploaded to S3:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("[Base64 Upload] Error:", error);
    throw error;
  }
};

