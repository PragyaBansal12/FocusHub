import express from "express";
import { subscribeToNotifications, unsubscribeFromNotifications } from "../controllers/NotificationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/subscribe", authMiddleware, subscribeToNotifications);
router.post("/unsubscribe", authMiddleware, unsubscribeFromNotifications);

export default router;
