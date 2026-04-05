import mongoose from 'mongoose';

const PickupRequestSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedItems: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        title: { type: String, required: true },
        quantity: { type: String, required: true }
      }
    ],
    deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    verificationPin: { type: String, required: true }, // Secured unique string for zero-fraud handshakes
    timeline: {
      acceptedAt: Date,
      pickedUpAt: Date,
      deliveredAt: Date,
    },
    isRated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PickupRequest', PickupRequestSchema);