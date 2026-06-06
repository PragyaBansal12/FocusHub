import Material from "../models/Material.js";
import User from "../models/User.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import https from 'https';
import axios from 'axios';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadFileToCloudinary(file) {
  return new Promise((resolve, reject) => {
    // 1. Failsafe: Ensure the file and buffer actually exist
    if (!file || !file.buffer) {
      return reject(new Error("File buffer is missing. Ensure Multer is using memoryStorage."));
    }

    const options = {
      // 2. Fix PDF timeouts: Let Cloudinary handle the file natively instead of forcing it to draw an image
      resource_type: 'auto', 
      folder: "learning_materials_app",
      use_filename: true,
      unique_filename: true
    };

    // 3. Create the upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary Stream Error:", error);
          return reject(new Error(`Cloudinary Upload Failed: ${error.message}`));
        }
        resolve(result);
      }
    );

    // 4. Convert the raw buffer into a stream and pipe it to Cloudinary
    Readable.from(file.buffer).pipe(uploadStream);
  });
}

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}

function autoGenerateTags(filename) {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  return nameWithoutExt
    .split(/[-_\s]+/)
    .filter(word => word.length > 2)
    .map(word => word.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);
}

// ============================================
// PUBLIC CONTROLLERS
// ============================================

/**
 * @route   POST /api/materials
 */
export async function uploadMaterial(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    const plan = user?.subscriptionPlan || 'free';
    if (plan === 'free') {
      const materialCount = await Material.countDocuments({ user: req.user.id });
      if (materialCount >= 3) {
        return res.status(403).json({ success: false, message: "Free tier limit reached. Maximum 3 materials allowed." });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(403).json({ success: false, message: "File exceeds 5MB limit for free tier." });
      }
    } else {
      if (req.file.size > 25 * 1024 * 1024) {
        return res.status(403).json({ success: false, message: "File exceeds 25MB limit for premium tier." });
      }
    }

    const uploadResult = await uploadFileToCloudinary(req.file);
    const { title, description, tags, subject } = req.body;
    
    let manualTags = [];
    if (tags) {
      try {
        manualTags = JSON.parse(tags);
      } catch (e) {
        manualTags = tags.split(',').map(t => t.trim());
      }
    }
    
    const combinedTags = [...new Set([...manualTags, ...autoGenerateTags(req.file.originalname)])];

    const material = await Material.create({
      user: req.user.id,
      title: title || req.file.originalname,
      description: description || "",
      originalName: req.file.originalname,
      fileType: getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: uploadResult.bytes,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      tags: combinedTags,
      subject: subject || ""
    });

    res.status(201).json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
}

/**
 * @route   GET /api/materials
 */
export async function getMaterials(req, res) {
  try {
    const { search, type, tag } = req.query;
    const query = { user: req.user.id };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (type) query.fileType = type;
    if (tag) query.tags = tag;

    const materials = await Material.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
}

/**
 * @route   GET /api/materials/:id/download
 */
export async function downloadMaterial(req, res) {
  try {
    const material = await Material.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    material.downloadCount = (material.downloadCount || 0) + 1;
    material.lastAccessed = new Date();
    await material.save();
    
    if (!material.fileUrl) {
      return res.status(500).json({ success: false, message: "File URL is missing in database" });
    }

    const secureUrl = material.fileUrl.replace('http://', 'https://');
    
    // 🔥 THE PROXY FIX: Stream the file from Cloudinary directly to the user
    https.get(secureUrl, (fileStream) => {
      // 1. Tell the frontend this is a file meant for downloading
      res.setHeader('Content-Disposition', `attachment; filename="${material.originalName || 'download.pdf'}"`);
      res.setHeader('Content-Type', fileStream.headers['content-type'] || 'application/pdf');
      
      // 2. Pipe the binary data directly into the response
      fileStream.pipe(res);
    }).on('error', (err) => {
      console.error("Cloudinary Stream Error:", err);
      res.status(500).json({ success: false, message: "Failed to pull file from Cloudinary" });
    });

  } catch (err) {
    console.error("❌ Download Error:", err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: "Invalid Material ID format" });
    }
    res.status(500).json({ success: false, message: "Download failed", error: err.message });
  }
}
/**
 * @route   DELETE /api/materials/:id
 */
export async function deleteMaterial(req, res) {
  try {
    const material = await Material.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    if (material.publicId) {
      // Determine resource_type to match upload logic
      let resourceType = 'image'; 
      if (material.fileType === 'video') resourceType = 'video';
      if (material.fileType === 'document') resourceType = 'raw';

      try {
        await cloudinary.uploader.destroy(material.publicId, { resource_type: resourceType });
      } catch (cloudErr) {
        console.warn("Cloudinary delete warning:", cloudErr.message);
      }
    }

    await Material.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
}

/**
 * @route   GET /api/materials/stats
 */
export async function getStorageStats(req, res) {
  try {
    const materials = await Material.find({ user: req.user.id });
    
    const stats = materials.reduce((acc, m) => {
      acc.totalSize += m.fileSize;
      acc.typeCount[m.fileType] = (acc.typeCount[m.fileType] || 0) + 1;
      m.tags.forEach(tag => acc.uniqueTags.add(tag));
      return acc;
    }, { totalSize: 0, typeCount: {}, uniqueTags: new Set() });

    res.json({
      success: true,
      totalFiles: materials.length,
      totalSize: stats.totalSize,
      totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
      byType: stats.typeCount,
      tags: Array.from(stats.uniqueTags)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Stats failed" });
  }
}

// Added back for single item fetching if needed
export async function getMaterial(req, res) {
  try {
    const material = await Material.findOne({ _id: req.params.id, user: req.user.id });
    if (!material) return res.status(404).json({ success: false });
    res.json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

