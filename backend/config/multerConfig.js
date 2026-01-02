// backend/config/multerConfig.js

import multer from "multer"

// ------------------------------------------------------------------
// 🛑 IMPORTANT CHANGE: Switch to Memory Storage 
// This stores the file as a buffer in req.file.buffer, avoiding local disk errors.
// ------------------------------------------------------------------
const storage = multer.memoryStorage(); 

// file filter (remains the same)
const fileFilter = (req, file, cb) => {
 // Allowed file types
 const allowedTypes = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
 ];

 if (allowedTypes.includes(file.mimetype)) {
  cb(null, true); // Accept file
 } else {
  cb(new Error(`File type ${file.mimetype} not allowed`), false); // Reject file
 }
};

// multer instance
const upload = multer({
  storage: storage, // Now using memory storage
  fileFilter: fileFilter,
  limits:{
    fileSize:50*1024*1024 // 50MB max file size
  }
});

export default upload;