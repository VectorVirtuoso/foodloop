// backend/controllers/pickupController.js
import PickupRequest from '../models/PickupRequest.js';
import FoodListing from '../models/FoodListing.js';
import User from '../models/User.js';
import { cancelExpiryWarning } from '../utils/queueService.js'; // <-- NEW

// @desc    NGO claims a food listing (or specific items from it)
// @route   POST /api/pickups/claim/:listingId
// @access  Private (NGOs Only)
export const createPickupRequest = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { itemIds } = req.body; // <-- Selected item IDs from front-end

    // 1. Find the listing
    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (listing.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'This food has already been claimed or expired' });
    }

    // Determine which items to claim
    let itemsToClaim = [];
    if (itemIds && itemIds.length > 0) {
      // NGO selected specific items
      itemsToClaim = listing.items.filter(item => 
        itemIds.includes(item._id.toString()) && item.status === 'AVAILABLE'
      );
    } else {
      // Default: Claim all available items (backwards compatibility)
      itemsToClaim = listing.items.filter(item => item.status === 'AVAILABLE');
    }

    if (itemsToClaim.length === 0) {
      return res.status(400).json({ success: false, message: 'No selected items are available for claim' });
    }

    // 2. Mark the claimed items in the listing
    itemsToClaim.forEach(item => {
      item.status = 'CLAIMED';
    });

    // Check if there are any remaining AVAILABLE items
    const hasAvailableLeft = listing.items.some(item => item.status === 'AVAILABLE');
    
    if (!hasAvailableLeft) {
      listing.status = 'MATCHED'; // Fully matched!
      // Cancel warning cron if everything is claimed early
      await cancelExpiryWarning(listingId);
    }

    await listing.save();

    // 3. Generate verification PIN
    const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Create the pickup transaction record
    const pickupRequest = await PickupRequest.create({
      listing: listingId,
      ngo: req.user._id,
      verificationPin,
      claimedItems: itemsToClaim.map(item => ({
        itemId: item._id,
        title: item.title,
        quantity: item.quantity
      }))
    });

    // Emit live radar refresh so other NGOs see remaining items or see listing disappear
    const io = req.app.get('io');
    if (io) {
      // Find the fully populated listing again to broadcast updated item counts
      const populatedListing = await FoodListing.findById(listingId).populate('donor', 'name rating totalRatings');
      io.emit('newFoodRadar', populatedListing);

      // Populate the newly created pickup request to send to the donor instantly
      const populatedPickup = await PickupRequest.findById(pickupRequest._id)
        .populate('listing', 'title quantity items')
        .populate('ngo', 'name phone');
      io.to(`user_${listing.donor.toString()}`).emit('incomingPickup', populatedPickup);
    }

    res.status(201).json({
      success: true,
      message: 'Food items claimed successfully. Present the PIN to the donor.',
      data: {
        pickupId: pickupRequest._id,
        verificationPin,
        listingDetails: listing,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Donor verifies the 4-digit PIN to hand over the food
// @route   POST /api/pickups/verify/:pickupId
// @access  Private (Donors Only)
export const verifyPickup = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const { pin } = req.body;

    // 1. Locate the pickup record
    const pickup = await PickupRequest.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup record not found' });
    }

    // 2. Verify security pin match
    if (pickup.verificationPin !== pin) {
      return res.status(401).json({ success: false, message: 'Invalid verification code. Food handover denied.' });
    }

    if (pickup.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This pickup transaction has already been processed' });
    }

    // 3. Update transaction states
    pickup.status = 'DELIVERED';
    pickup.timeline.deliveredAt = new Date();
    await pickup.save();

    // 4. Permanently mark matching items in FoodListing as COMPLETED
    const listing = await FoodListing.findById(pickup.listing);
    if (listing) {
      const claimedIds = pickup.claimedItems.map(ci => ci.itemId.toString());
      listing.items.forEach(item => {
        if (claimedIds.includes(item._id.toString())) {
          item.status = 'COMPLETED';
        }
      });

      // If all items are now COMPLETED, mark the entire listing as COMPLETED
      const allCompleted = listing.items.every(item => item.status === 'COMPLETED');
      if (allCompleted) {
        listing.status = 'COMPLETED';
      }
      await listing.save();
    }

    // 5. WebSocket: Close chat session and notify NGO's private room to trigger review pop-up
    const io = req.app.get('io');
    if (io) {
      io.to(`pickup_chat_${pickupId}`).emit('chatClosed');

      // Populate and send completed pickup to NGO instantly
      const populatedPickup = await PickupRequest.findById(pickupId)
        .populate({
          path: 'listing',
          populate: { path: 'donor', select: 'name' }
        });
      io.to(`user_${pickup.ngo.toString()}`).emit('pickupDelivered', populatedPickup);
    }

    res.status(200).json({
      success: true,
      message: 'Handover verified successfully! Secure loop closed.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Add this below your existing verifyPickup function

// @desc    Get active pickups for a donor
// @route   GET /api/pickups/active
// @access  Private (Donors Only)
export const getDonorPickups = async (req, res) => {
  try {
    // 1. Find all listings by this donor (regardless of MATCHED status, since listings can be partially claimed and remain AVAILABLE)
    const myListings = await FoodListing.find({ donor: req.user._id }).select('_id');
    const listingIds = myListings.map(listing => listing._id);

    // 2. Find the pending pickup requests linked to those listings
    const activePickups = await PickupRequest.find({ 
      listing: { $in: listingIds }, 
      status: 'PENDING' 
    })
    .populate('listing', 'title quantity items') // Bring in food details & items
    .populate('ngo', 'name phone');        // Bring in NGO details so the restaurant knows who is coming

    res.status(200).json({ success: true, data: activePickups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get active pickups for an NGO
// @route   GET /api/pickups/ngo/active
// @access  Private (NGOs Only)
export const getNgoPickups = async (req, res) => {
  try {
    const activePickups = await PickupRequest.find({ 
      ngo: req.user._id, 
      status: 'PENDING' 
    })
    .populate({
      path: 'listing',
      populate: { path: 'donor', select: 'name phone' }
    });

    res.status(200).json({ success: true, data: activePickups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get completed pickups that need rating
// @route   GET /api/pickups/reviews/pending
// @access  Private (NGO Only)
export const getPendingReviews = async (req, res) => {
  try {
    const pendingReviews = await PickupRequest.find({
      ngo: req.user._id,
      status: 'DELIVERED', // 🐛 FIXED: Was 'COMPLETED'
      isRated: false
    })
    .populate({
      path: 'listing',
      populate: { path: 'donor', select: 'name' } 
    });

    res.status(200).json({ success: true, data: pendingReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Submit a rating for a donor
// @route   POST /api/pickups/:pickupId/rate
// @access  Private (NGO Only)
export const ratePickup = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const { rating } = req.body; 

    const pickup = await PickupRequest.findById(pickupId).populate('listing');
    
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    if (pickup.ngo.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    // 🐛 FIXED: Was 'COMPLETED'
    if (pickup.status !== 'DELIVERED') return res.status(400).json({ message: 'Pickup not completed yet' }); 
    
    if (pickup.isRated) return res.status(400).json({ message: 'Already rated' });

    // Find the donor to update their score
    const donor = await User.findById(pickup.listing.donor);
    
    // Calculate the new average rating
    const newTotal = donor.totalRatings + 1;
    const newAverage = ((donor.rating * donor.totalRatings) + Number(rating)) / newTotal;

    donor.rating = newAverage;
    donor.totalRatings = newTotal;
    await donor.save();

    // Mark pickup as rated
    pickup.isRated = true;
    await pickup.save();

    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};