
import express from 'express';
// Ensure the correct path and .js extension for ES modules
import {authMiddleware as protect} from '../middleware/authMiddleware.js'; 
import * as calendarController from '../controllers/calendarController.js'; 

const router = express.Router();

// All routes require the user to be logged in (protected)
router.get('/google', protect, calendarController.googleAuth);
router.get('/google/callback', calendarController.googleAuthCallback);
router.get('/status', protect, calendarController.checkSyncStatus);
router.post('/disconnect', protect, calendarController.disconnectCalendar);

export default router;