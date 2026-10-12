import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Save a generated trip itinerary
 * @route   POST /api/trips
 */
export const createTrip = async (req, res, next) => {
  try {
    const tripData = {
      ...req.body,
      user: req.user.id,
    };

    const trip = await Trip.create(tripData);
    res.status(201).json({
      success: true,
      message: 'Trip saved successfully',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all trips saved by the current user
 * @route   GET /api/trips
 */
export const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.user.id })
      .select('destination coordinates tripDates numberOfDays travelers budget travelStyle budgetSummary createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed trip itinerary by ID
 * @route   GET /api/trips/:id
 */
export const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    if (trip.user.toString() !== req.user.id) {
      return next(new AppError('Not authorized to access this trip itinerary', 403));
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trip data
 * @route   PUT /api/trips/:id
 */
export const updateTrip = async (req, res, next) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    if (trip.user.toString() !== req.user.id) {
      return next(new AppError('Not authorized to modify this trip', 403));
    }

    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:id
 */
export const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    if (trip.user.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this trip', 403));
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
