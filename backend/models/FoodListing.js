import mongoose from 'mongoose';

const FoodListingSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    foodType: { type: String, enum: ['VEG', 'NON-VEG'], default: 'VEG', required: true },
    quantity: { type: String, required: true }, // e.g., "15 kg" or "Serves 30"
    items: [
      {
        title: { type: String, required: true },
        quantity: { type: String, required: true },
        status: {
          type: String,
          enum: ['AVAILABLE', 'CLAIMED', 'COMPLETED'],
          default: 'AVAILABLE',
        },
      }
    ],
    images: [{ type: String }], 
    expiryTime: { type: Date, required: true },
    pickupWindow: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'MATCHED', 'IN_TRANSIT', 'COMPLETED', 'EXPIRED'],
      default: 'AVAILABLE',
    },
    safetyChecklist: {
      isFreshlyPrepared: { type: Boolean, default: false },
      storedCorrectly: { type: Boolean, default: false },
      hygieneVerified: { type: Boolean, default: false },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: { type: String, required: true },
    isCritical: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Crucial index for our matching engine's $near geospatial queries
FoodListingSchema.index({ location: '2dsphere' });
FoodListingSchema.index({ status: 1, expiryTime: 1 });

export default mongoose.model('FoodListing', FoodListingSchema);