import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization of S3 client to ensure env vars are loaded
let s3Client = null;

/**
 * Get or create S3 client instance
 */
const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  // Get AWS credentials from environment
  const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
  const S3_ACCESS_KEY_ID = process.env.S3ACCESSKEYID;
  const S3_SECRET_ACCESS_KEY = process.env.S3ACCESSKEY;

  // Validate credentials
  if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    console.error("[S3 Config] Missing AWS credentials!");
    console.error("[S3 Config] AWS_REGION:", AWS_REGION);
    console.error("[S3 Config] S3ACCESSKEYID:", S3_ACCESS_KEY_ID ? `${S3_ACCESS_KEY_ID.substring(0, 4)}...` : "MISSING");
    console.error("[S3 Config] S3ACCESSKEY:", S3_SECRET_ACCESS_KEY ? "***" : "MISSING");
    console.error("[S3 Config] All env vars:", Object.keys(process.env).filter(k => k.includes('S3') || k.includes('AWS')));
    throw new Error("AWS S3 credentials are not configured. Please set S3ACCESSKEYID and S3ACCESSKEY environment variables.");
  }

  // Validate credential format and strip quotes if present
  let accessKeyId = typeof S3_ACCESS_KEY_ID === 'string' ? S3_ACCESS_KEY_ID.trim() : '';
  let secretAccessKey = typeof S3_SECRET_ACCESS_KEY === 'string' ? S3_SECRET_ACCESS_KEY.trim() : '';
  
  // Remove surrounding quotes if present (sometimes .env files include them)
  if (accessKeyId && ((accessKeyId.startsWith('"') && accessKeyId.endsWith('"')) || 
      (accessKeyId.startsWith("'") && accessKeyId.endsWith("'")))) {
    accessKeyId = accessKeyId.slice(1, -1).trim();
  }
  if (secretAccessKey && ((secretAccessKey.startsWith('"') && secretAccessKey.endsWith('"')) || 
      (secretAccessKey.startsWith("'") && secretAccessKey.endsWith("'")))) {
    secretAccessKey = secretAccessKey.slice(1, -1).trim();
  }
  
  if (!accessKeyId || accessKeyId === '') {
    throw new Error("S3ACCESSKEYID is empty or invalid");
  }
  if (!secretAccessKey || secretAccessKey === '') {
    throw new Error("S3ACCESSKEY is empty or invalid");
  }

  console.log("[S3 Config] Initializing S3 client with:", {
    region: AWS_REGION,
    bucket: process.env.BUCKETNAME || "email-backend-ticket",
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
    accessKeyIdLength: accessKeyId.length,
    secretAccessKeyLength: secretAccessKey.length,
    accessKeyIdPrefix: accessKeyId.substring(0, 4) + "...",
  });

  // Initialize S3 client with cleaned credentials
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

  return s3Client;
};

const BUCKET_NAME = () => process.env.BUCKETNAME || "email-backend-ticket";
// Ensure S3_ENDPOINT doesn't have trailing slash for URL construction
const S3_ENDPOINT_BASE = () => {
  const endpoint = process.env.S3_ENDPOINT || "https://email-backend-ticket.s3.ap-south-1.amazonaws.com";
  return endpoint.replace(/\/$/, "");
};

/**
 * Upload a file buffer to S3
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} originalFileName - Original file name
 * @param {string} contentType - MIME type (e.g., 'image/jpeg', 'video/mp4')
 * @param {string} folder - Optional folder path in S3 (e.g., 'images', 'videos')
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadToS3 = async (fileBuffer, originalFileName, contentType, folder = "social-media") => {
  try {
    // Get S3 client (lazy initialization)
    const client = getS3Client();
    const bucketName = BUCKET_NAME();
    const endpointBase = S3_ENDPOINT_BASE();

    // Generate unique file name
    const fileExtension = originalFileName.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const uniqueId = uuidv4().split("-")[0];
    const fileName = `${folder}/${timestamp}-${uniqueId}.${fileExtension}`;

    console.log("[S3 Upload] Uploading file:", {
      bucket: bucketName,
      key: fileName,
      contentType,
      size: fileBuffer.length,
    });

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      // Note: ACL is deprecated in newer S3 buckets. Ensure bucket has public read access policy.
      // If ACL doesn't work, configure bucket policy to allow public read access
    });

    await client.send(command);

    // Return public URL (S3_ENDPOINT should be the base URL without trailing slash)
    const publicUrl = `${endpointBase}/${fileName}`;
    console.log("[S3 Upload] File uploaded successfully:", publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error("[S3 Upload] Error uploading file:", error);
    console.error("[S3 Upload] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Upload a base64 image to S3
 * @param {string} base64String - Base64 encoded image string (with data URI prefix)
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadBase64ToS3 = async (base64String) => {
  try {
    // Extract base64 data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 string");
    }

    const contentType = matches[1]; // e.g., 'image/jpeg'
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, "base64");
    
    // Determine file extension from content type
    const ext = contentType.split("/")[1] || "jpg";
    const fileName = `image-${Date.now()}.${ext}`;
    
    // Upload to S3
    return await uploadToS3(buffer, fileName, contentType, "images");
  } catch (error) {
    console.error("[S3 Upload] Error uploading base64 image:", error);
    throw error;
  }
};

/**
 * Upload a file from multer file object to S3
 * @param {Object} file - Multer file object (req.file or req.files[0])
 * @param {string} folder - Optional folder path in S3
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadMulterFileToS3 = async (file, folder = "social-media") => {
  try {
    if (!file || !file.buffer) {
      throw new Error("Invalid file object - file.buffer is required");
    }

    const contentType = file.mimetype || "application/octet-stream";
    const originalName = file.originalname || `file-${Date.now()}`;
    
    return await uploadToS3(file.buffer, originalName, contentType, folder);
  } catch (error) {
    console.error("[S3 Upload] Error uploading multer file:", error);
    throw error;
  }
};

export default {
  uploadToS3,
  uploadBase64ToS3,
  uploadMulterFileToS3,
};

