import * as placesService from '../services/placesService.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Search for places using text search query
 * @route   POST /api/places/search
 */
export const searchPlaces = async (req, res, next) => {
  try {
    const { query, location, maxResults } = req.body;

    if (!query || !query.trim()) {
      return next(new AppError('Search query is required', 400));
    }

    const places = await placesService.searchPlaces(
      query.trim(),
      location || null,
      parseInt(maxResults, 10) || 10
    );

    res.status(200).json({
      success: true,
      count: places.length,
      places,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get photo URL for place
 * @route   GET /api/places/photo/:photoRef
 */
export const getPlacePhoto = async (req, res, next) => {
  try {
    const photoRef = req.params.photoRef || req.params[0];
    const maxWidth = parseInt(req.query.maxWidth, 10) || 400;

    if (!photoRef) {
      return next(new AppError('Photo reference is required', 400));
    }

    const url = placesService.getPhotoUrl(photoRef, maxWidth);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
};
