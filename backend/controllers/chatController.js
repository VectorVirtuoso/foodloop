import ChatMessage from '../models/ChatMessage.js';
import PickupRequest from '../models/PickupRequest.js';

// @desc    Get chat message history for a pickup request room
// @route   GET /api/chat/history/:pickupId
// @access  Private (NGO and Donors Only)
export const getChatHistory = async (req, res) => {
  try {
    const { pickupId } = req.params;

    // 1. Verify pickup request exists
    const pickup = await PickupRequest.findById(pickupId).populate('listing');
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found' });
    }

    // 2. Security validation: Ensure req.user is either the NGO or the Donor linked to this pickup
    const isNGO = pickup.ngo.toString() === req.user._id.toString();
    const isDonor = pickup.listing.donor.toString() === req.user._id.toString();

    if (!isNGO && !isDonor) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to chat room history' });
    }

    // 3. Fetch messages ordered chronologically
    const history = await ChatMessage.find({ pickupRequest: pickupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
