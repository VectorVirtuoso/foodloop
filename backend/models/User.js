import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['DONOR', 'NGO', 'DELIVERY', 'ADMIN'],
      required: true,
    },
    phone: { type: String, required: true },
    // Profile profiles embedded for seamless indexing
    donorProfile: {
      businessName: String,
      businessType: { type: String, enum: ['RESTAURANT', 'MESS', 'CATERER', 'OTHER'] },
      isVerified: { type: Boolean, default: false },
    },
    ngoProfile: {
      organizationName: String,
      registrationNumber: String,
      capacityPeople: Number,
      isVerified: { type: Boolean, default: false },
    },
    // GeoJSON Point for proximity-based matching engine
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: { type: String, required: true },
    rating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

export default mongoose.model('User', UserSchema);