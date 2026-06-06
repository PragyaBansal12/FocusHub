import express from "express";
import { login, signup, getMe ,getAllStudents,googleLogin,logout} from "../controllers/AuthController.js" // 🔥 FIX: Import getMe
import { authMiddleware } from "../middleware/authMiddleware.js"; // 🔥 FIX: Import authMiddleware

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/google", googleLogin);


router.get("/me", authMiddleware, getMe);

router.get("/students", authMiddleware, getAllStudents);

export default router;