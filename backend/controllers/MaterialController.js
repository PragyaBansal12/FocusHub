// backend/controllers/MaterialController.js

import Material from "../models/Material.js";
import { v2 as cloudinary } from 'cloudinary'; // ⬅️ NEW: Cloudinary import
import dotenv from 'dotenv'; // ⬅️ NEW: for accessing environment variables

// Remove unused fs, path, and URL imports as they are no longer needed
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config(); // Load CLOUDINARY credentials from .env

// ------------------------------------------------------------------
// 🛑 CLOUDINARY CONFIGURATION
// ------------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ------------------------------------------------------------------
// CLOUDINARY HELPER
// ------------------------------------------------------------------
/**
 * Uploads a file buffer (from Multer) to Cloudinary.
 */
async function uploadFileToCloudinary(file) {
    // Convert the buffer to a Base64 string for upload
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    const options = {
        resource_type: "auto", // Automatically detect file type (image/video/raw)
        folder: "learning_materials_app", // Dedicated folder on Cloudinary
    };
    
    // Upload and return the result object
    return await cloudinary.uploader.upload(dataURI, options);
}

// ============================================
// HELPER FUNCTIONS (UNCHANGED)
// ============================================

/**
 * Determine file type category from MIME type
 */
function getFileType(mimeType) {
 if (mimeType.startsWith('image/')) return 'image';
 if (mimeType.startsWith('video/')) return 'video';
 if (mimeType === 'application/pdf') return 'pdf';
 return 'document';
}

/**
 * Auto-generate tags from filename
 */
function autoGenerateTags(filename) {
 const nameWithoutExt = filename.replace(/\.[^/.]+$/, ""); // Simple way to remove extension
 
 const words = nameWithoutExt
  .split(/[-_\s]+/)
  .filter(word => word.length > 2)
  .map(word => word.toLowerCase());
 
 return [...new Set(words)];
}

// ============================================
// UPLOAD MATERIAL (MODIFIED FOR CLOUDINARY)
// ============================================

export async function uploadMaterial(req, res) {
 try {
  console.log("📤 Starting material upload to Cloudinary");
  
  // Check if file buffer was uploaded by Multer
  if (!req.file) {
   return res.status(400).json({ message: "No file uploaded" });
  }

    // ------------------------------------------------------------------
    // 🛑 CLOUDINARY UPLOAD STEP
    // ------------------------------------------------------------------
    const uploadResult = await uploadFileToCloudinary(req.file);
    // ------------------------------------------------------------------

  const { title, description, tags, subject } = req.body;
  
  // Parse tags
  let tagArray = [];
  if (tags) {
   try {
    tagArray = JSON.parse(tags);
   } catch (e) {
    tagArray = tags.split(',').map(t => t.trim());
   }
  }
  
  // Auto-generate tags
  const autoTags = autoGenerateTags(req.file.originalname);
  
  // Combine manual and auto tags
  const allTags = [...new Set([...tagArray, ...autoTags])];

  // Create material document (use Cloudinary data)
  const material = await Material.create({
   user: req.userId,
   title: title || req.file.originalname,
   description: description || "",
   originalName: req.file.originalname,
   fileType: getFileType(req.file.mimetype),
   mimeType: req.file.mimetype,
   
        // ⬅️ Cloudinary Fields
   fileSize: uploadResult.bytes, // File size from Cloudinary
   fileUrl: uploadResult.secure_url, // The public URL to the file
   publicId: uploadResult.public_id, // Cloudinary ID for deletion
        // 🛑 We no longer use fileName and filePath
        // fileName: req.file.filename,
        // filePath: req.file.path, 
        // -----------------------
        
   tags: allTags,
   subject: subject || ""
  });

  console.log("✅ Material uploaded to Cloudinary and saved:", material._id);

  res.status(201).json({ 
   message: "Material uploaded successfully", 
   material 
  });
 } catch (err) {
  console.error("❌ Error uploading material:", err);
  
  // 🛑 Removed fs.unlinkSync as we are not using disk storage
  
  res.status(500).json({ 
   message: "Error uploading material", 
   error: err.message 
  });
 }
}

// ============================================
// GET ALL MATERIALS (UNCHANGED)
// ============================================

export async function getMaterials(req, res) {
 try {
  console.log("📥 Fetching materials for user:", req.userId);
  
  const { search, type, tag } = req.query;
  
  // Build filter
  const filter = { user: req.userId };
  
  // Search by title, tags, or subject
  if (search) {
   filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { tags: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } }
   ];
  }
  
  // Filter by file type
  if (type) {
   filter.fileType = type;
  }
  
  // Filter by specific tag
  if (tag) {
   filter.tags = tag;
  }

  const materials = await Material.find(filter).sort({ createdAt: -1 });
  
  console.log(`✅ Found ${materials.length} materials`);
  
  res.json({ materials });
 } catch (err) {
  console.error("❌ Error fetching materials:", err);
  res.status(500).json({ 
   message: "Error fetching materials", 
   error: err.message 
  });
 }
}

// ============================================
// GET SINGLE MATERIAL (UNCHANGED)
// ============================================

export async function getMaterial(req, res) {
 try {
  const { id } = req.params;
  
  const material = await Material.findOne({ _id: id, user: req.userId });
  
  if (!material) {
   return res.status(404).json({ message: "Material not found" });
  }
  
  res.json({ material });
 } catch (err) {
  console.error("❌ Error fetching material:", err);
  res.status(500).json({ 
   message: "Error fetching material", 
   error: err.message 
  });
 }
}

// ============================================
// DOWNLOAD MATERIAL (MODIFIED FOR CLOUDINARY)
// ============================================

export async function downloadMaterial(req, res) {
 try {
  const { id } = req.params;
  
  const material = await Material.findOne({ _id: id, user: req.userId });
  
  if (!material) {
   return res.status(404).json({ message: "Material not found" });
  }
  
  // 🛑 With Cloudinary, the file is accessed via the stored URL.
    // We redirect the user to the public URL for download.
    if (!material.fileUrl) {
        return res.status(404).json({ message: "File URL not found" });
    }

  // Update download count and last accessed
  material.downloadCount += 1;
  material.lastAccessed = new Date();
  await material.save();
  
  console.log(`📥 Redirecting for download: ${material.originalName}`);
  
  // 🛑 Use redirect to send the user to the Cloudinary URL
  res.redirect(material.fileUrl);

 } catch (err) {
  console.error("❌ Error downloading material:", err);
  res.status(500).json({ 
   message: "Error downloading material", 
   error: err.message 
  });
 }
}

// ============================================
// DELETE MATERIAL (FIXED FOR 500 ERROR)
// ============================================

export async function deleteMaterial(req, res) {
try {
 const { id } = req.params;
 
 console.log("🗑️ Deleting material:", id);
 
 // Find the material by ID and user ID
 const material = await Material.findOne({ _id: id, user: req.userId });
 
 if (!material) {
 return res.status(404).json({ message: "Material not found" });
 }
 
 // ------------------------------------------------------------------
 // 🛑 DELETE FROM CLOUDINARY (WITH FIXES)
 // ------------------------------------------------------------------
 if (material.publicId) {
 
  // Determine the correct resource_type for deletion
  let deleteResourceType;
  if (material.fileType === 'video') {
   deleteResourceType = 'video';
  } else if (material.fileType === 'pdf' || material.fileType === 'document') {
   // CRITICAL FIX: PDFs/documents are usually raw assets on delete
   deleteResourceType = 'raw';
  } else {
   deleteResourceType = 'image'; // Images default to image
  }

 try {
  const deleteResult = await cloudinary.uploader.destroy(material.publicId, {
    resource_type: deleteResourceType
  });
  
  console.log(`✅ File deleted from Cloudinary (Type: ${deleteResourceType}):`, deleteResult.result);

  // You may want to check for deleteResult.result === 'not found' here, 
  // but since we are continuing to delete the DB record, this is safe.

 } catch (cloudinaryErr) {
  // Prevents the entire server from crashing (500 error) if Cloudinary fails 
  // for reasons like a connection timeout or an already-deleted file.
  console.warn(`⚠️ Cloudinary deletion failed for ${material.publicId}:`, cloudinaryErr.message);
  // IMPORTANT: We continue execution to delete the database record anyway.
 }
 }
 // ------------------------------------------------------------------
 
 // Delete from database
 await Material.deleteOne({ _id: id });
 
 console.log("✅ Material deleted from database");
 
 res.json({ message: "Material deleted successfully" });
} catch (err) {
 console.error("❌ Error deleting material:", err);
 res.status(500).json({ 
 message: "Server error during material deletion", 
 error: err.message 
 });
}
}
// ============================================
// GET STORAGE STATS (UNCHANGED)
// ============================================

export async function getStorageStats(req, res) {
 try {
  const materials = await Material.find({ user: req.userId });
  
  const totalSize = materials.reduce((sum, m) => sum + m.fileSize, 0);
  const totalFiles = materials.length;
  
  // Count by type
  const byType = materials.reduce((acc, m) => {
   acc[m.fileType] = (acc[m.fileType] || 0) + 1;
   return acc;
  }, {});
  
  // Get all unique tags
  const allTags = [...new Set(materials.flatMap(m => m.tags))];
  
  res.json({
   totalFiles,
   totalSize, // in bytes
   totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
   byType,
   tags: allTags
  });
 } catch (err) {
  console.error("❌ Error fetching storage stats:", err);
  res.status(500).json({ 
   message: "Error fetching storage stats", 
   error: err.message 
  });
 }
}