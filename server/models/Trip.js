import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    placeId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    userRatingsTotal: { type: Number, default: 0 },
    openingHours: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    category: { type: String, default: '' },
    priceLevel: { type: Number, default: -1 },
    vicinity: { type: String, default: '' },
    websiteUri: { type: String, default: '' },
  },
  { _id: false }
);

const routeInfoSchema = new mongoose.Schema(
  {
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    distance: { type: String, default: '0 km' },
    distanceMeters: { type: Number, default: 0 },
    duration: { type: String, default: '0 mins' },
    durationSeconds: { type: Number, default: 0 },
    polyline: { type: String, default: '' },
    travelMode: { type: String, default: 'DRIVE' },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    time: { type: String, default: 'Morning' },
    period: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night'], default: 'Morning' },
    place: { type: placeSchema, required: true },
    notes: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0 },
    routeToNext: { type: routeInfoSchema, default: null },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String, default: '' },
    title: { type: String, default: '' },
    theme: { type: String, default: '' },
    activities: { type: [activitySchema], default: [] },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startingLocation: {
      type: String,
      default: '',
      trim: true,
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    tripDates: {
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Trip duration must be at least 1 day'],
      max: [30, 'Trip duration cannot exceed 30 days'],
    },
    travelers: {
      type: Number,
      default: 2,
      min: [1, 'At least 1 traveler required'],
    },
    budget: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    interests: {
      type: [String],
      default: [],
    },
    travelStyle: {
      type: String,
      default: 'balanced',
      enum: ['relaxed', 'balanced', 'packed'],
    },
    constraints: {
      type: String,
      default: '',
    },
    itinerary: {
      type: [daySchema],
      default: [],
    },
    hotelRecommendations: {
      type: [placeSchema],
      default: [],
    },
    restaurantRecommendations: {
      type: [placeSchema],
      default: [],
    },
    budgetSummary: {
      estimatedTotal: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      perPerson: { type: Number, default: 0 },
      perDay: { type: Number, default: 0 },
    },
    naturalLanguageInput: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ user: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
