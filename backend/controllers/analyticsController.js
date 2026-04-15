// backend/controllers/analyticsController.js
import PickupRequest from '../models/PickupRequest.js';
import FoodListing from '../models/FoodListing.js'; // <-- NEW IMPORT REQUIRED
import User from '../models/User.js';

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let relevantPickups = [];

    // 1. SAFE DATABASE QUERIES (No more memory filtering)
    if (role === 'NGO') {
      relevantPickups = await PickupRequest.find({ ngo: userId, status: 'DELIVERED' })
        .populate({ path: 'listing', populate: { path: 'donor', select: 'name rating' } })
        .populate('ngo', 'name')
        .sort({ 'timeline.deliveredAt': -1 });
    } else if (role === 'DONOR') {
      // Find all listings belonging to this specific donor first
      const donorListings = await FoodListing.find({ donor: userId }).select('_id');
      const listingIds = donorListings.map(l => l._id);

      // Only fetch pickups tied to those exact listings
      relevantPickups = await PickupRequest.find({ listing: { $in: listingIds }, status: 'DELIVERED' })
        .populate({ path: 'listing', populate: { path: 'donor', select: 'name rating' } })
        .populate('ngo', 'name')
        .sort({ 'timeline.deliveredAt': -1 });
    }

    // 2. HERO METRICS
    const totalHandovers = relevantPickups.length;
    const trustScore = req.user.rating || 0;

    // 3. DIETARY BREAKDOWN
    let vegCount = 0;
    let nonVegCount = 0;
    
    relevantPickups.forEach(p => {
      if (p.listing?.foodType === 'VEG') vegCount++;
      if (p.listing?.foodType === 'NON-VEG') nonVegCount++;
    });

    const dietaryBreakdown = [
      { name: 'Vegetarian', value: vegCount, fill: '#10b981' }, 
      { name: 'Non-Vegetarian', value: nonVegCount, fill: '#f59e0b' } 
    ];

    // 4. IMPACT OVER TIME
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        meals: 0,
        fullDate: d.toISOString().split('T')[0]
      };
    }).reverse();

    relevantPickups.forEach(p => {
      if (p.timeline?.deliveredAt) {
        const deliveryDate = new Date(p.timeline.deliveredAt).toISOString().split('T')[0];
        const dayIndex = last7Days.findIndex(d => d.fullDate === deliveryDate);
        if (dayIndex !== -1) {
          const match = p.listing?.quantity?.toString().match(/\d+/);
          const mealCount = match ? parseInt(match[0]) : 1;
          last7Days[dayIndex].meals += mealCount;
        }
      }
    });

    // 5. ACTIVITY LEDGER
    const recentTransactions = relevantPickups.slice(0, 5).map(p => ({
      id: p._id,
      title: p.listing?.title || 'Unknown Food Item',
      quantity: p.listing?.quantity || 'N/A',
      partnerName: role === 'DONOR' ? p.ngo?.name || 'Unknown NGO' : p.listing?.donor?.name || 'Unknown Donor',
      date: p.timeline?.deliveredAt || p.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        hero: { totalHandovers, trustScore },
        charts: { dietaryBreakdown, impactOverTime: last7Days },
        ledger: recentTransactions
      }
    });

  } catch (error) {
    console.error("Analytics Error Details:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};