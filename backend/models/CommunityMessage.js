import mongoose from "mongoose";

const communityMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  { timestamps: true }
);

// Index for fetching latest messages quickly
communityMessageSchema.index({ createdAt: -1 });

export default mongoose.model("CommunityMessage", communityMessageSchema);
