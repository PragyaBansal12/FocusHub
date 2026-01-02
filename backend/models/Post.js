import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    // Author
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    // Content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    
    // Organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    // Engagement
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // Metrics
    views: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    
    // Status
    isEdited: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for search and sorting
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ createdAt: -1 });
postSchema.index({ upvotes: 1 });

// Virtual for vote count
postSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

export default mongoose.model("Post", postSchema);