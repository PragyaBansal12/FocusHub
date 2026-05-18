import express from "express";
import { getCommunityMessages } from "../controllers/CommunityChatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route (require authentication) to fetch community chat history
router.use(authMiddleware);
router.get("/messages", getCommunityMessages);

export default router;
