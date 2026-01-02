import express from "express";
import { saveSession, getSessions, getStats } from "../controllers/PomodoroController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/", saveSession);        // POST /api/pomodoro
router.get("/", getSessions);         // GET /api/pomodoro
router.get("/stats", getStats);       // GET /api/pomodoro/stats

export default router;