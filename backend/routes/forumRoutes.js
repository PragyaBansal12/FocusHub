import express from "express";
import {
  getPosts,
  getPost,
  getCommentReplies,
  getTrendingTags,
  getUserPosts,
  updatePost
} from "../controllers/ForumController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (anyone can view)
router.get("/posts", getPosts);
router.get("/posts/:id", getPost);
router.get("/comments/:commentId/replies", getCommentReplies);
router.get("/tags/trending", getTrendingTags);

// Protected routes (require authentication)
router.use(authMiddleware);
router.get("/my-posts", getUserPosts);
router.put("/posts/:id", updatePost);

export default router;