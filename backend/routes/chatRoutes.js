import express from 'express';
import { getChatHistory } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Fetch message logs for a specific pickup chat room
router.get('/history/:pickupId', protect, getChatHistory);

export default router;
