import express from 'express';
import { createPickupRequest, verifyPickup, getDonorPickups, getNgoPickups, getPendingReviews, ratePickup } from '../controllers/pickupController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only an NGO can initiate a claim
router.post('/claim/:listingId', protect, authorizeRoles('NGO'), createPickupRequest);

// DONOR views who is coming
router.get('/active', protect, authorizeRoles('DONOR'), getDonorPickups); // <-- ADDED THIS

// NGO views active pickups they claimed
router.get('/ngo/active', protect, authorizeRoles('NGO'), getNgoPickups); // <-- NEW

// Add these with your other NGO routes
router.get('/reviews/pending', protect, authorizeRoles('NGO'), getPendingReviews);
router.post('/:pickupId/rate', protect, authorizeRoles('NGO'), ratePickup);

// Only a DONOR (the restaurant) can input the code to release the food
router.post('/verify/:pickupId', protect, authorizeRoles('DONOR'), verifyPickup);



export default router;