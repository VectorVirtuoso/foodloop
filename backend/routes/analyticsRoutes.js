// backend/routes/analyticsRoutes.js
import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Both NGOs and Donors can hit this route to get their specific stats
router.get('/', protect, getAnalytics);

export default router;