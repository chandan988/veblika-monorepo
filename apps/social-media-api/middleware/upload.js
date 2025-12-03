import multer from "multer";

// Use memory storage - files will be in req.file.buffer for S3 upload
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export default upload;
