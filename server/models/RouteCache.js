import mongoose from 'mongoose';

const routeCacheSchema = new mongoose.Schema(
  {
    routeKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    origin: {
      type: String,
      default: '',
    },
    destination: {
      type: String,
      default: '',
    },
    travelMode: {
      type: String,
      default: 'DRIVE',
    },
    places: {
      type: Array,
      default: [],
    },
    totalPlaces: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7 * 24 * 60 * 60, // 7 days TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
const RouteCache = mongoose.models.RouteCache || mongoose.model('RouteCache', routeCacheSchema);

export default RouteCache;
