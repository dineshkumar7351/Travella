import * as placesService from './placesService.js';
import * as routesService from './routesService.js';
import * as openaiService from './openaiService.js';
import * as budgetService from './budgetService.js';

/**
 * End-to-end trip itinerary generator utilizing Google Places, Routes, OpenAI & Budget Engine
 */
export const generateItinerary = async (tripParams, onProgress = () => {}) => {
  const {
    destination,
    numberOfDays = 3,
    travelers = 2,
    budget = { amount: 0, currency: 'INR' },
    interests = [],
    travelStyle = 'balanced',
    constraints = '',
  } = tripParams;

  // Step 1: Resolve destination coordinates
  onProgress({ step: 1, message: `Locating coordinates for ${destination}...` });
  const coordinates = await placesService.getDestinationCoordinates(destination);

  // Step 2: Fetch verified real attractions
  onProgress({ step: 2, message: `Discovering attractions in ${destination}...` });
  const attractions = await placesService.searchPlacesByType(
    destination,
    'attractions',
    coordinates,
    interests
  );

  // Step 3: Fetch verified hotels and restaurants
  onProgress({ step: 3, message: `Finding top accommodations & dining in ${destination}...` });
  const hotels = await placesService.searchPlacesByType(
    destination,
    'hotels',
    coordinates
  );

  const restaurants = await placesService.searchPlacesByType(
    destination,
    'restaurants',
    coordinates
  );

  // Combine places registry
  const allPlaces = [...attractions, ...hotels, ...restaurants];
  const placeMap = new Map(allPlaces.map((p) => [p.placeId, p]));

  // Step 4: AI organizes the itinerary using REAL data only
  onProgress({ step: 4, message: `Crafting day-by-day itinerary with AI...` });
  const aiResult = await openaiService.organizeItinerary({
    places: attractions,
    hotels,
    restaurants,
    tripParams: {
      destination,
      numberOfDays,
      travelers,
      budget,
      interests,
      travelStyle,
      constraints,
    },
  });

  // Step 5: Build final day structure and calculate real routes
  onProgress({ step: 5, message: `Calculating routes and travel times with Google Routes...` });
  const finalDays = [];

  for (const rawDay of aiResult.days || []) {
    const activities = [];

    for (const act of rawDay.activities || []) {
      const place = placeMap.get(act.placeId);
      if (place) {
        activities.push({
          time: act.time || '10:00 AM',
          period: act.period || 'Morning',
          place,
          notes: act.notes || `Visit ${place.name}`,
          estimatedCost: Number(act.estimatedCost || 300),
          routeToNext: null,
        });
      }
    }

    // Calculate sequential routes for activities in this day
    for (let i = 0; i < activities.length - 1; i++) {
      const fromPlace = activities[i].place;
      const toPlace = activities[i + 1].place;

      try {
        const routeData = await routesService.calculateRoute(
          { latitude: fromPlace.latitude, longitude: fromPlace.longitude },
          { latitude: toPlace.latitude, longitude: toPlace.longitude }
        );

        activities[i].routeToNext = {
          from: fromPlace.name,
          to: toPlace.name,
          ...routeData,
        };
      } catch (routeErr) {
        console.warn(`Route calculation warning (${fromPlace.name} -> ${toPlace.name}):`, routeErr.message);
      }
    }

    finalDays.push({
      day: rawDay.day,
      date: rawDay.date || '',
      title: rawDay.title || `Day ${rawDay.day}: Discovering ${destination}`,
      theme: rawDay.theme || '',
      activities,
    });
  }

  // Recommended hotels and restaurants
  const hotelRecommendations = (aiResult.hotelRecommendations || [])
    .map((id) => placeMap.get(id))
    .filter(Boolean);

  const restaurantRecommendations = (aiResult.restaurantRecommendations || [])
    .map((id) => placeMap.get(id))
    .filter(Boolean);

  // Budget summary
  const budgetSummary = aiResult.budgetSummary || budgetService.estimateBudget({
    numberOfDays,
    travelers,
    budget,
    travelStyle,
  });

  return {
    destination,
    coordinates,
    numberOfDays,
    travelers,
    budget,
    interests,
    travelStyle,
    constraints,
    itinerary: finalDays,
    hotelRecommendations: hotelRecommendations.length > 0 ? hotelRecommendations : hotels.slice(0, 4),
    restaurantRecommendations: restaurantRecommendations.length > 0 ? restaurantRecommendations : restaurants.slice(0, 5),
    budgetSummary: {
      ...budgetSummary,
      currency: budget?.currency || 'INR',
    },
  };
};

/**
 * Modifies an existing saved trip itinerary using AI
 */
export const modifyExistingItinerary = async (trip, modification) => {
  // Aggregate existing places
  const existingPlaces = [];
  for (const day of trip.itinerary || []) {
    for (const act of day.activities || []) {
      if (act.place) existingPlaces.push(act.place);
    }
  }
  const combinedPlaces = [
    ...existingPlaces,
    ...(trip.hotelRecommendations || []),
    ...(trip.restaurantRecommendations || []),
  ];

  // Fetch additional places from Google if user asks for specific new categories
  let additionalPlaces = [];
  const needsSearch = /add|more|vegetarian|vegan|beach|museum|club|cafe|hotel|market/i.test(modification);

  if (needsSearch) {
    try {
      additionalPlaces = await placesService.searchPlaces(
        `${modification} in ${trip.destination}`,
        trip.coordinates,
        8
      );
    } catch (err) {
      console.warn('Additional places search error:', err.message);
    }
  }

  const allAvailablePlaces = [...combinedPlaces, ...additionalPlaces];
  const placeMap = new Map(allAvailablePlaces.map((p) => [p.placeId, p]));

  const currentItineraryPayload = {
    days: (trip.itinerary || []).map((day) => ({
      day: day.day,
      title: day.title,
      activities: (day.activities || []).map((a) => ({
        time: a.time,
        period: a.period,
        placeId: a.place?.placeId,
        placeName: a.place?.name,
        notes: a.notes,
        estimatedCost: a.estimatedCost,
      })),
    })),
    hotelRecommendations: (trip.hotelRecommendations || []).map((h) => h.placeId),
    restaurantRecommendations: (trip.restaurantRecommendations || []).map((r) => r.placeId),
    budgetSummary: trip.budgetSummary,
  };

  const modifiedAi = await openaiService.modifyItinerary({
    currentItinerary: currentItineraryPayload,
    modification,
    availablePlaces: allAvailablePlaces,
    tripParams: {
      destination: trip.destination,
      numberOfDays: trip.numberOfDays,
      travelers: trip.travelers,
      budget: trip.budget,
      travelStyle: trip.travelStyle,
    },
  });

  // Re-build itinerary with full places and recalculate routes
  const updatedDays = [];

  for (const rawDay of modifiedAi.days || []) {
    const activities = [];

    for (const act of rawDay.activities || []) {
      const place = placeMap.get(act.placeId);
      if (place) {
        activities.push({
          time: act.time || '10:00 AM',
          period: act.period || 'Morning',
          place,
          notes: act.notes || `Visit ${place.name}`,
          estimatedCost: Number(act.estimatedCost || 300),
          routeToNext: null,
        });
      }
    }

    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i].place;
      const to = activities[i + 1].place;
      try {
        const routeData = await routesService.calculateRoute(
          { latitude: from.latitude, longitude: from.longitude },
          { latitude: to.latitude, longitude: to.longitude }
        );
        activities[i].routeToNext = {
          from: from.name,
          to: to.name,
          ...routeData,
        };
      } catch (err) {
        console.warn(`Route recalculation error (${from.name} -> ${to.name}):`, err.message);
      }
    }

    updatedDays.push({
      day: rawDay.day,
      date: rawDay.date || '',
      title: rawDay.title || `Day ${rawDay.day}`,
      theme: rawDay.theme || '',
      activities,
    });
  }

  const hotelRecommendations = (modifiedAi.hotelRecommendations || [])
    .map((id) => placeMap.get(id))
    .filter(Boolean);

  const restaurantRecommendations = (modifiedAi.restaurantRecommendations || [])
    .map((id) => placeMap.get(id))
    .filter(Boolean);

  return {
    itinerary: updatedDays,
    hotelRecommendations: hotelRecommendations.length > 0 ? hotelRecommendations : trip.hotelRecommendations,
    restaurantRecommendations: restaurantRecommendations.length > 0 ? restaurantRecommendations : trip.restaurantRecommendations,
    budgetSummary: modifiedAi.budgetSummary || trip.budgetSummary,
    modificationsApplied: modifiedAi.modificationsApplied || `Updated itinerary: ${modification}`,
  };
};

export default {
  generateItinerary,
  modifyExistingItinerary,
};
