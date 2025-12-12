import mongoose from "mongoose"
const materialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    // File information
    fileName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileType: {
      type: String, // 'pdf', 'image', 'video', 'document'
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number, // Size in bytes
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    // Organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    subject: {
      type: String,
      trim: true
    },
    // Metadata
    downloadCount: {
      type: Number,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true 
  }
);

// Index for search
materialSchema.index({ title: 'text', tags: 'text', subject: 'text' });

export default mongoose.model("Material", materialSchema);