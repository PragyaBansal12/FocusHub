import Material from "../models/Material.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER FUNCTIONS
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
 * Example: "DSA-sorting-algorithms.pdf" → ["dsa", "sorting", "algorithms"]
 */
function autoGenerateTags(filename) {
  // Remove extension
  const nameWithoutExt = path.parse(filename).name;
  
  // Split by common separators
  const words = nameWithoutExt
    .split(/[-_\s]+/)
    .filter(word => word.length > 2) // Ignore short words
    .map(word => word.toLowerCase());
  
  return [...new Set(words)]; // Remove duplicates
}

// ============================================
// UPLOAD MATERIAL
// ============================================

export async function uploadMaterial(req, res) {
  try {
    console.log("📤 Uploading material");
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, tags, subject } = req.body;
    
    // Parse tags (sent as JSON string from frontend)
    let tagArray = [];
    if (tags) {
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
        tagArray = tags.split(',').map(t => t.trim());
      }
    }
    
    // Auto-generate tags from filename
    const autoTags = autoGenerateTags(req.file.originalname);
    
    // Combine manual and auto tags
    const allTags = [...new Set([...tagArray, ...autoTags])];

    // Create material document
    const material = await Material.create({
      user: req.userId,
      title: title || req.file.originalname,
      description: description || "",
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      tags: allTags,
      subject: subject || ""
    });

    console.log("✅ Material uploaded:", material._id);

    res.status(201).json({ 
      message: "Material uploaded successfully", 
      material 
    });
  } catch (err) {
    console.error("❌ Error uploading material:", err);
    
    // Delete file if database save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: "Error uploading material", 
      error: err.message 
    });
  }
}

// ============================================
// GET ALL MATERIALS
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
// GET SINGLE MATERIAL
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
// DOWNLOAD MATERIAL
// ============================================

export async function downloadMaterial(req, res) {
  try {
    const { id } = req.params;
    
    const material = await Material.findOne({ _id: id, user: req.userId });
    
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    
    // Check if file exists
    if (!fs.existsSync(material.filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }
    
    // Update download count and last accessed
    material.downloadCount += 1;
    material.lastAccessed = new Date();
    await material.save();
    
    console.log(`📥 Downloading: ${material.originalName}`);
    
    // Send file
    res.download(material.filePath, material.originalName);
  } catch (err) {
    console.error("❌ Error downloading material:", err);
    res.status(500).json({ 
      message: "Error downloading material", 
      error: err.message 
    });
  }
}

// ============================================
// DELETE MATERIAL
// ============================================

export async function deleteMaterial(req, res) {
  try {
    const { id } = req.params;
    
    console.log("🗑️ Deleting material:", id);
    
    const material = await Material.findOne({ _id: id, user: req.userId });
    
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
      console.log("✅ File deleted from disk");
    }
    
    // Delete from database
    await Material.deleteOne({ _id: id });
    
    console.log("✅ Material deleted from database");
    
    res.json({ message: "Material deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting material:", err);
    res.status(500).json({ 
      message: "Error deleting material", 
      error: err.message 
    });
  }
}

// ============================================
// GET STORAGE STATS
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