import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";

const router = express.Router();

// Get chat history between current user and another student
router.get("/history/:otherUserId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const { otherUserId } = req.params;

    // Generate the unique conversation ID (same logic as frontend)
    const conversationId = [myId, otherUserId].sort().join("-");

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(50); // Load last 50 messages

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
