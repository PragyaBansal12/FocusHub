// routes/authRoutes.js - FINAL CORRECTED VERSION

import express from "express";
import { login, signup, getMe ,getAllStudents} from "../controllers/AuthController.js" // 🔥 FIX: Import getMe
import { authMiddleware } from "../middleware/authMiddleware.js"; // 🔥 FIX: Import authMiddleware

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// =============================================
// 🔥 CRITICAL FIX: Session Check Endpoint
// =============================================
router.get("/me", authMiddleware, getMe);

router.get("/students", authMiddleware, getAllStudents);

export default router;