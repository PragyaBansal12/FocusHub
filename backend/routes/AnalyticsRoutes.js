import express from "express";
import {
  getFocusTime,
  getTaskAnalytics,
  getPomodoroSessions
} from "../controllers/AnalyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/focus-time", getFocusTime);
router.get("/tasks", getTaskAnalytics);
router.get("/pomodoro-sessions", getPomodoroSessions);

export default router;