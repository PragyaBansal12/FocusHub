import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // because Google users won't have password
    },
    googleId: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
