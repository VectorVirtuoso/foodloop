import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    pickupRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupRequest',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add index for fast retrieval of message logs by pickupRequest ID
ChatMessageSchema.index({ pickupRequest: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', ChatMessageSchema);
