import * as routesService from '../services/routesService.js';
import * as placesService from '../services/placesService.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Calculate simple route between two points
 * @route   POST /api/routes/calculate
 */
export const calculateRoute = async (req, res, next) => {
  try {
    const { origin, destination, travelMode } = req.body;

    if (!origin || !destination) {
      return next(new AppError('Origin and destination coordinates are required', 400));
    }

    const origLat = origin.latitude ?? origin.lat;
    const origLng = origin.longitude ?? origin.lng;
    const destLat = destination.latitude ?? destination.lat;
    const destLng = destination.longitude ?? destination.lng;

    if (origLat === undefined || origLng === undefined || destLat === undefined || destLng === undefined) {
      return next(new AppError('Valid latitude and longitude are required for both origin and destination', 400));
    }

    const route = await routesService.calculateRoute(
      { latitude: origLat, longitude: origLng },
      { latitude: destLat, longitude: destLng },
      travelMode || 'DRIVE'
    );

    res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Plan Route-First Travel: computes primary & alternate routes, checks traffic, and fetches along-route services
 * @route   POST /api/routes/plan
 */
export const planRoute = async (req, res, next) => {
  try {
    const { origin, destination, travelMode = 'DRIVE', categories = [] } = req.body;

    if (!origin || !destination) {
      return next(new AppError('Starting point and destination are required', 400));
    }

    // Resolve Origin Coordinates
    let originCoords = null;
    if (typeof origin === 'object' && origin.latitude && origin.longitude) {
      originCoords = origin;
    } else if (typeof origin === 'string' && origin.trim()) {
      originCoords = await placesService.getDestinationCoordinates(origin.trim());
    }

    // Resolve Destination Coordinates
    let destCoords = null;
    if (typeof destination === 'object' && destination.latitude && destination.longitude) {
      destCoords = destination;
    } else if (typeof destination === 'string' && destination.trim()) {
      destCoords = await placesService.getDestinationCoordinates(destination.trim());
    }

    if (!originCoords || !destCoords) {
      return next(new AppError('Could not resolve coordinates for the starting point or destination', 400));
    }

    // Fetch rich location details for both starting location and destination location
    const originName = typeof origin === 'string' ? origin.trim() : 'Starting Location';
    const destName = typeof destination === 'string' ? destination.trim() : 'Destination Location';

    const [originDetails, destinationDetails, routePlan] = await Promise.all([
      placesService.getLocationDetails(originName, originCoords),
      placesService.getLocationDetails(destName, destCoords),
      routesService.computeRoutesWithAlternatives(originCoords, destCoords, travelMode),
    ]);

    // Fetch along-route places for the primary route
    const activeRoute = routePlan.routes[0];
    let alongRoutePlaces = { totalPlaces: 0, places: [], byCategory: {}, categories: [] };

    try {
      alongRoutePlaces = await placesService.searchPlacesAlongRoute({
        polyline: activeRoute?.polyline || '',
        waypoints: activeRoute?.waypoints || [],
        steps: activeRoute?.steps || [],
        originName,
        destName,
        travelMode,
        categories,
      });
    } catch (placesErr) {
      console.error('[Along-Route Places Overpass Error]:', placesErr.message);
      // Return clear error message without fake data
      alongRoutePlaces = {
        totalPlaces: 0,
        places: [],
        byCategory: {},
        categories: [],
        error: `Failed to fetch places from Overpass API: ${placesErr.message}`,
      };
    }

    res.status(200).json({
      success: true,
      origin: {
        query: originName,
        coordinates: originCoords,
        details: originDetails,
      },
      destination: {
        query: destName,
        coordinates: destCoords,
        details: destinationDetails,
      },
      routes: routePlan.routes,
      activeRouteId: routePlan.activeRouteId,
      trafficDetected: routePlan.trafficDetected,
      trafficMessage: routePlan.trafficMessage,
      alongRoutePlaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch along-route places for a chosen route polyline / category filters
 * @route   POST /api/routes/along-route
 */
export const getPlacesAlongRoute = async (req, res, next) => {
  try {
    const {
      polyline,
      waypoints = [],
      steps = [],
      originName = '',
      destName = '',
      travelMode = 'DRIVE',
      categories = [],
    } = req.body;

    const placesResult = await placesService.searchPlacesAlongRoute({
      polyline,
      waypoints,
      steps,
      originName,
      destName,
      travelMode,
      categories,
    });

    res.status(200).json({
      success: true,
      ...placesResult,
    });
  } catch (error) {
    next(
      new AppError(
        `Failed to fetch places from Overpass API: ${error.message || 'Overpass service unavailable'}`,
        502
      )
    );
  }
};

/**
 * @desc    Quick route calculation for instant map rendering when user inputs locations
 * @route   POST /api/routes/quick-route
 */
export const quickRoute = async (req, res, next) => {
  try {
    const { origin, destination, travelMode = 'DRIVE' } = req.body;

    if (!origin || !destination) {
      return next(new AppError('Starting point and destination are required', 400));
    }

    let originCoords = null;
    if (typeof origin === 'object' && origin.latitude && origin.longitude) {
      originCoords = origin;
    } else if (typeof origin === 'string' && origin.trim()) {
      originCoords = await placesService.getDestinationCoordinates(origin.trim());
    }

    let destCoords = null;
    if (typeof destination === 'object' && destination.latitude && destination.longitude) {
      destCoords = destination;
    } else if (typeof destination === 'string' && destination.trim()) {
      destCoords = await placesService.getDestinationCoordinates(destination.trim());
    }

    if (!originCoords || !destCoords) {
      return next(new AppError('Could not resolve coordinates for the locations', 400));
    }

    const routePlan = await routesService.computeRoutesWithAlternatives(originCoords, destCoords, travelMode);

    res.status(200).json({
      success: true,
      origin: {
        query: typeof origin === 'string' ? origin.trim() : 'Starting Point',
        coordinates: originCoords,
      },
      destination: {
        query: typeof destination === 'string' ? destination.trim() : 'Destination',
        coordinates: destCoords,
      },
      routes: routePlan.routes,
      activeRouteId: routePlan.activeRouteId,
    });
  } catch (error) {
    next(error);
  }
};

