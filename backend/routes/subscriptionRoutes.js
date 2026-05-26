import express from 'express';
import { createSubscription, verifySubscription } from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/create', createSubscription);
router.post('/verify', verifySubscription);

export default router;
