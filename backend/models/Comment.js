import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // References
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    
    // Engagement
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // Nested Comments (Replies)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    
    // Status
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

// Index for fast retrieval
commentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);