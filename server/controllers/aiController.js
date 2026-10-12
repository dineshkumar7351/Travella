import * as openaiService from '../services/openaiService.js';
import * as itineraryService from '../services/itineraryService.js';
import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Parse natural language trip prompt into structured JSON
 * @route   POST /api/ai/parse-trip
 */
export const parseTrip = async (req, res, next) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return next(new AppError('Please provide a natural language trip description', 400));
    }

    const tripParams = await openaiService.parseTripRequest(input.trim());

    res.status(200).json({
      success: true,
      tripParams,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate full itinerary using Google Places + Google Routes + OpenAI
 * @route   POST /api/ai/generate-itinerary
 */
export const generateItinerary = async (req, res, next) => {
  try {
    const tripParams = req.body;

    if (!tripParams.destination || !tripParams.destination.trim()) {
      return next(new AppError('Destination is required', 400));
    }

    const days = parseInt(tripParams.numberOfDays, 10) || 3;
    if (days < 1 || days > 30) {
      return next(new AppError('Number of days must be between 1 and 30', 400));
    }

    const result = await itineraryService.generateItinerary(tripParams);

    res.status(200).json({
      success: true,
      trip: {
        destination: result.destination,
        coordinates: result.coordinates,
        numberOfDays: result.numberOfDays,
        travelers: result.travelers,
        budget: result.budget,
        interests: result.interests,
        travelStyle: result.travelStyle,
        constraints: result.constraints,
        itinerary: result.itinerary,
        hotelRecommendations: result.hotelRecommendations,
        restaurantRecommendations: result.restaurantRecommendations,
        budgetSummary: result.budgetSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modify existing itinerary with AI instruction
 * @route   POST /api/ai/modify-itinerary
 */
export const modifyItineraryHandler = async (req, res, next) => {
  try {
    const { tripId, currentTrip, modification } = req.body;

    if (!modification || !modification.trim()) {
      return next(new AppError('Please specify what you want to modify', 400));
    }

    let tripToModify = currentTrip;

    if (tripId) {
      const dbTrip = await Trip.findById(tripId);
      if (!dbTrip) {
        return next(new AppError('Trip not found', 404));
      }
      if (dbTrip.user.toString() !== req.user.id) {
        return next(new AppError('Not authorized to modify this trip', 403));
      }
      tripToModify = dbTrip;
    }

    if (!tripToModify) {
      return next(new AppError('Trip data is required for modification', 400));
    }

    const result = await itineraryService.modifyExistingItinerary(tripToModify, modification.trim());

    // If tripId was passed, persist changes to database
    if (tripId) {
      const updated = await Trip.findByIdAndUpdate(
        tripId,
        {
          itinerary: result.itinerary,
          hotelRecommendations: result.hotelRecommendations,
          restaurantRecommendations: result.restaurantRecommendations,
          budgetSummary: result.budgetSummary,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        trip: updated,
        modificationsApplied: result.modificationsApplied,
      });
    }

    // Otherwise return updated object for unsaved live itinerary
    res.status(200).json({
      success: true,
      trip: {
        ...tripToModify,
        itinerary: result.itinerary,
        hotelRecommendations: result.hotelRecommendations,
        restaurantRecommendations: result.restaurantRecommendations,
        budgetSummary: result.budgetSummary,
      },
      modificationsApplied: result.modificationsApplied,
    });
  } catch (error) {
    next(error);
  }
};
