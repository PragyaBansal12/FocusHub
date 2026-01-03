import express from "express";
import User from "../models/User.js";
import { upload } from "../config/cloudinary.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   PUT /api/user/update
// @desc    Update user profile (Name and/or Image)
// @access  Private
router.put("/update", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Build the update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    
    // If a new file was uploaded, req.file.path is the URL provided by Cloudinary
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    // Find the user and update only the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // This returns the updated document instead of the old one
    ).select("-password"); // Exclude password from the response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the updated user object
    res.json(updatedUser);
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

export default router;