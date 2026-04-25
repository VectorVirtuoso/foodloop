// backend/controllers/listingController.js
import FoodListing from '../models/FoodListing.js';
import schedule from 'node-schedule';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { scheduleExpiryWarning } from '../utils/queueService.js'; // <-- NEW

// @desc    Create a new food listing
// @route   POST /api/listings
// @access  Private (Donors Only)
export const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      foodType,
      quantity,
      expiryTime,
      pickupWindowStart,
      pickupWindowEnd,
      isFreshlyPrepared,
      storedCorrectly,
      hygieneVerified,
      items, // <-- NEW items array
    } = req.body;

    // Build the items list for backwards compatibility
    const itemsList = items && items.length > 0 
      ? items.map(item => ({ title: item.title, quantity: item.quantity, status: 'AVAILABLE' }))
      : [{ title, quantity, status: 'AVAILABLE' }];

    const newListing = await FoodListing.create({
      donor: req.user._id, 
      title, 
      description,
      foodType,
      quantity, 
      items: itemsList, // Store nested items list
      expiryTime,
      pickupWindow: {
        start: pickupWindowStart,
        end: pickupWindowEnd,
      },
      location: req.user.location, 
      address: req.user.address,
      safetyChecklist: {
        isFreshlyPrepared,
        storedCorrectly,
        hygieneVerified,
      },
    });

    // Populate the donor name AND ratings so the frontend card looks right
    const populatedListing = await FoodListing.findById(newListing._id).populate('donor', 'name rating totalRatings');
    
    // Broadcast the newly created food to all connected NGOs!
    const io = req.app.get('io');
    if (io) {
      io.emit('newFoodRadar', populatedListing);
    }

    // Schedule the 2-hour emergency warning alert
    await scheduleExpiryWarning(
      newListing._id.toString(), 
      expiryTime, 
      req.user.location.coordinates
    );

    // 🧹 THE AUTOMATED JANITOR
    // Schedule a background job to run at the exact expiry time
    const expiryDate = new Date(expiryTime);
    
    schedule.scheduleJob(newListing._id.toString(), expiryDate, async () => {
      console.log(`🧹 Janitor waking up to check listing: ${newListing._id}`);
      
      try {
        const listingToCheck = await FoodListing.findById(newListing._id);
        
        if (listingToCheck && listingToCheck.status !== 'COMPLETED') {
          listingToCheck.status = 'EXPIRED';
          // Mark any remaining available items as expired/completed
          listingToCheck.items.forEach(item => {
            if (item.status === 'AVAILABLE') item.status = 'COMPLETED';
          });
          await listingToCheck.save();
          console.log(`🚨 Food expired! Removed from radar: ${newListing.title}`);
          
          if (io) {
            io.emit('foodExpired', newListing._id);
          }
        }
      } catch (err) {
        console.error("Janitor encountered an error:", err);
      }
    });
    
    // 📧 THE OFFLINE RADAR (Nodemailer)
    // Find all NGOs within a 10km radius of the Donor
    try {
      const radiusInMeters = 10000; // 10km
      const nearbyNGOs = await User.find({
        role: 'NGO',
        location: {
          $near: {
            $geometry: { 
              type: 'Point', 
              coordinates: req.user.location.coordinates // [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        }
      });

      console.log(`Radar found ${nearbyNGOs.length} nearby NGOs. Dispatching emails...`);

      // Blast an email to every NGO in the radius
      const emailPromises = nearbyNGOs.map(ngo => {
        const message = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #047857;">🚨 Urgent Food Available Nearby!</h2>
            <p><strong>${populatedListing.donor.name}</strong> just posted surplus food on the radar.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Item:</strong> ${title}</p>
              <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity}</p>
              <p style="margin: 5px 0; color: #dc2626;"><strong>Expires at:</strong> ${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <p>Log in to your FoodLoop dashboard to claim it and secure the handover PIN before another organization does.</p>
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #047857; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open Live Radar</a>
          </div>
        `;

        return sendEmail({
          email: ngo.email, // Make sure your dummy NGO has a real email address you can check!
          subject: `FoodLoop Alert: ${quantity} available near you`,
          message
        });
      });

      // We run this in the background so it doesn't slow down the frontend response
      Promise.all(emailPromises).catch(err => console.error("Background email dispatch failed:", err));

    } catch (emailError) {
      console.error("Failed to execute offline radar:", emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Food listing created successfully',
      data: newListing,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get nearby available food listings
// @route   GET /api/listings/nearby
// @access  Private (NGOs Only)
export const getNearbyListings = async (req, res) => {
  try {
    // 1. Extract coordinates and radius from the query parameters (default to 5km)
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide lat and lng' });
    }

    // 2. Convert radius from kilometers to meters (MongoDB $near expects meters)
    const radiusInMeters = parseInt(radius) * 1000;

    // 3. The Magic Query
    const listings = await FoodListing.find({
      status: 'AVAILABLE', // Only show food that hasn't been claimed or expired
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)], // Remember: [longitude, latitude]
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).populate('donor', 'name phone address rating totalRatings'); // This attaches the Restaurant's basic info to the result!

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};