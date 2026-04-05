// backend/routes/listingRoutes.js
import express from 'express';
import { createListing, getNearbyListings } from '../controllers/listingController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Here is the magic: Protect checks the JWT, authorizeRoles checks if it's a DONOR
router.post('/', protect, authorizeRoles('DONOR'), createListing);

// NGOs search for food here
router.get('/nearby', protect, authorizeRoles('NGO'), getNearbyListings);

export default router;