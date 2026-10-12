import Groq from 'groq-sdk';

let groqClient = null;

const getClient = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your_') || apiKey.includes('sk-your-') || apiKey.includes('gsk_your_')) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

/**
 * Parses natural language input into validated structured trip parameters using Groq (Llama 3.3 70B / Llama 3.1 8B)
 */
export const parseTripRequest = async (input) => {
  const client = getClient();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI travel assistant powered by Groq. Convert the user's natural language trip request into a JSON object matching this exact schema:
{
  "destination": "string (e.g., Goa, India)",
  "startingLocation": "string (e.g., Mumbai, India, or empty string)",
  "numberOfDays": number (integer 1-30, default 3),
  "travelers": number (integer 1-20, default 2),
  "budget": {
    "amount": number (integer, 0 if not specified),
    "currency": "INR"
  },
  "interests": ["array of valid interests from: beaches, mountains, history, food, nightlife, adventure, shopping, nature, culture, wildlife, relaxation"],
  "travelStyle": "relaxed" | "balanced" | "packed" (default "balanced"),
  "constraints": "string (any dietary, mobility, or specific preferences)",
  "tripDates": {
    "startDate": "string or empty",
    "endDate": "string or empty"
  }
}
Respond with valid JSON ONLY. No markdown, no commentary.`,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content?.trim();
      const parsed = JSON.parse(raw);
      return sanitizeParsedTrip(parsed, input);
    } catch (err) {
      console.warn(`[Groq AI Parser] Remote parsing note (${err.message}). Using regex parser.`);
    }
  }

  return fallbackNaturalLanguageParser(input);
};

const sanitizeParsedTrip = (parsed, rawInput) => {
  const validInterests = [
    'beaches',
    'mountains',
    'history',
    'food',
    'nightlife',
    'adventure',
    'shopping',
    'nature',
    'culture',
    'wildlife',
    'relaxation',
  ];

  const interests = (parsed.interests || []).filter((i) => validInterests.includes(i.toLowerCase()));

  return {
    destination: parsed.destination || 'Goa, India',
    startingLocation: parsed.startingLocation || '',
    numberOfDays: Math.min(Math.max(parseInt(parsed.numberOfDays, 10) || 3, 1), 30),
    travelers: Math.min(Math.max(parseInt(parsed.travelers, 10) || 2, 1), 20),
    budget: {
      amount: parseInt(parsed.budget?.amount, 10) || 0,
      currency: parsed.budget?.currency || 'INR',
    },
    interests: interests.length > 0 ? interests : ['beaches', 'food', 'relaxation'],
    travelStyle: ['relaxed', 'balanced', 'packed'].includes(parsed.travelStyle) ? parsed.travelStyle : 'balanced',
    constraints: parsed.constraints || '',
    tripDates: parsed.tripDates || { startDate: '', endDate: '' },
    naturalLanguageInput: rawInput,
  };
};

/**
 * Regex based fallback parser
 */
const fallbackNaturalLanguageParser = (text) => {
  const lower = text.toLowerCase();

  // Destination
  let destination = 'Goa, India';
  const tripPatternMatch = text.match(/\b(?:\d+[- ]day\s+)?([A-Za-z\s]+?)\s+(?:trip|vacation|tour|itinerary|holiday)\b/i);
  const destMatch = text.match(/(?:to|in|visit|trip to|for)\s+([A-Za-z\s]+?)(?=\s+(?:for|with|under|in|\d+|trip|$))/i);

  if (tripPatternMatch && tripPatternMatch[1] && tripPatternMatch[1].trim().length > 1) {
    destination = tripPatternMatch[1].trim();
  } else if (destMatch && destMatch[1] && destMatch[1].trim().length > 1) {
    destination = destMatch[1].trim();
  }

  // Days
  let numberOfDays = 3;
  const daysMatch = text.match(/(\d+)\s*[-]?\s*(?:day|days|d\b)/i);
  if (daysMatch) {
    numberOfDays = parseInt(daysMatch[1], 10);
  }

  // Travelers
  let travelers = 2;
  const travelersMatch = text.match(/(\d+)\s*(?:people|persons|travelers|adults|friends|pax)/i);
  if (travelersMatch) {
    travelers = parseInt(travelersMatch[1], 10);
  } else if (lower.includes('solo')) {
    travelers = 1;
  } else if (lower.includes('couple')) {
    travelers = 2;
  } else if (lower.includes('family')) {
    travelers = 4;
  }

  // Budget
  let budgetAmount = 0;
  const budgetMatch = text.match(/(?:under|budget of|within|costing|budget|₹|rs\.?|inr)\s*₹?\s*([\d,]+)(?:\s*(?:k|thousand|lakh|lakhs))?/i);
  if (budgetMatch) {
    let numStr = budgetMatch[1].replace(/,/g, '');
    let num = parseInt(numStr, 10);
    if (text.match(/₹?\s*([\d,]+)\s*k\b/i)) {
      num = parseInt(text.match(/₹?\s*([\d,]+)\s*k\b/i)[1].replace(/,/g, ''), 10) * 1000;
    } else if (text.match(/₹?\s*([\d,]+)\s*lakh/i)) {
      num = parseInt(text.match(/₹?\s*([\d,]+)\s*lakh/i)[1].replace(/,/g, ''), 10) * 100000;
    }
    budgetAmount = num || 0;
  }

  // Interests
  const allInterests = ['beaches', 'mountains', 'history', 'food', 'nightlife', 'adventure', 'shopping', 'nature', 'culture', 'wildlife', 'relaxation'];
  const matchedInterests = allInterests.filter((item) => lower.includes(item) || (item === 'food' && (lower.includes('culinary') || lower.includes('dining'))));

  // Style
  let travelStyle = 'balanced';
  if (lower.includes('relax') || lower.includes('chill') || lower.includes('slow')) {
    travelStyle = 'relaxed';
  } else if (lower.includes('packed') || lower.includes('action') || lower.includes('fast')) {
    travelStyle = 'packed';
  }

  return {
    destination,
    startingLocation: '',
    numberOfDays,
    travelers,
    budget: {
      amount: budgetAmount,
      currency: 'INR',
    },
    interests: matchedInterests.length > 0 ? matchedInterests : ['beaches', 'food', 'relaxation'],
    travelStyle,
    constraints: '',
    tripDates: { startDate: '', endDate: '' },
    naturalLanguageInput: text,
  };
};

/**
 * Organizes real Google Places into an optimized day-by-day itinerary using Groq AI
 * STRICT REAL DATA ENFORCEMENT: ONLY uses provided place IDs
 */
export const organizeItinerary = async ({ places, hotels, restaurants, tripParams }) => {
  const client = getClient();

  const placesPayload = places.map((p) => ({
    placeId: p.placeId,
    name: p.name,
    category: p.category,
    rating: p.rating,
    latitude: p.latitude,
    longitude: p.longitude,
    priceLevel: p.priceLevel,
  }));

  const hotelsPayload = hotels.map((h) => ({
    placeId: h.placeId,
    name: h.name,
    rating: h.rating,
    priceLevel: h.priceLevel,
  }));

  const restaurantsPayload = restaurants.map((r) => ({
    placeId: r.placeId,
    name: r.name,
    rating: r.rating,
    priceLevel: r.priceLevel,
  }));

  if (client && placesPayload.length > 0) {
    try {
      const prompt = `You are an expert travel planner powered by Groq high-speed AI. Create an optimized ${tripParams.numberOfDays}-day itinerary for ${tripParams.destination}.
User Preferences:
- Travel Style: ${tripParams.travelStyle} (relaxed: 2-3 activities/day, balanced: 3-4 activities/day, packed: 4-5 activities/day)
- Interests: ${(tripParams.interests || []).join(', ')}
- Travelers: ${tripParams.travelers}
- Budget: ${tripParams.budget?.amount || 'Flexible'} ${tripParams.budget?.currency || 'INR'}
- Constraints: ${tripParams.constraints || 'None'}

STRICT CRITICAL RULES:
1. ONLY use placeId values from the provided Available Places, Available Hotels, and Available Restaurants arrays.
2. DO NOT invent or fabricate any place names, coordinates, or place IDs.
3. Group activities geographically nearby each day.
4. Schedule logical times (Morning, Afternoon, Evening, Night).
5. Output valid JSON only.

Schema:
{
  "days": [
    {
      "day": 1,
      "title": "Exploration theme for day",
      "theme": "Theme description",
      "activities": [
        {
          "time": "09:30 AM",
          "period": "Morning",
          "placeId": "exact_placeId_from_data",
          "notes": "Practical tip or recommended thing to do here",
          "estimatedCost": 400
        }
      ]
    }
  ],
  "hotelRecommendations": ["placeId1", "placeId2", "placeId3"],
  "restaurantRecommendations": ["placeId1", "placeId2", "placeId3"],
  "budgetSummary": {
    "estimatedTotal": 50000,
    "accommodation": 18000,
    "food": 14000,
    "activities": 10000,
    "transport": 8000,
    "currency": "INR"
  }
}`;

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: `Available Places:\n${JSON.stringify(placesPayload, null, 2)}\n\nAvailable Hotels:\n${JSON.stringify(hotelsPayload, null, 2)}\n\nAvailable Restaurants:\n${JSON.stringify(restaurantsPayload, null, 2)}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content?.trim());
      if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[Groq Itinerary Planner] Note (${err.message}). Using deterministic clustering organizer.`);
    }
  }

  // Deterministic clustering organizer using REAL data
  return deterministicItineraryOrganizer({ places, hotels, restaurants, tripParams });
};

/**
 * Heuristic clustering organizer that operates solely on real Google Places data
 */
const deterministicItineraryOrganizer = ({ places, hotels, restaurants, tripParams }) => {
  const daysCount = tripParams.numberOfDays || 3;
  const style = tripParams.travelStyle || 'balanced';
  const activitiesPerDay = style === 'relaxed' ? 3 : style === 'packed' ? 5 : 4;

  const periods = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const times = ['09:00 AM', '01:00 PM', '04:30 PM', '08:00 PM'];

  // Sort places by rating
  const sortedAttractions = [...places].sort((a, b) => b.rating - a.rating);
  const sortedRestaurants = [...restaurants].sort((a, b) => b.rating - a.rating);

  const days = [];
  let attractionIndex = 0;
  let restaurantIndex = 0;

  for (let d = 1; d <= daysCount; d++) {
    const dayActivities = [];
    const countForDay = Math.min(activitiesPerDay, 4);

    for (let slot = 0; slot < countForDay; slot++) {
      let placeToUse = null;

      // Slot 1 is Lunch / Slot 3 is Dinner or Evening Dining
      if ((slot === 1 || slot === 3) && sortedRestaurants.length > 0) {
        placeToUse = sortedRestaurants[restaurantIndex % sortedRestaurants.length];
        restaurantIndex++;
      } else if (sortedAttractions.length > 0) {
        placeToUse = sortedAttractions[attractionIndex % sortedAttractions.length];
        attractionIndex++;
      } else if (sortedRestaurants.length > 0) {
        placeToUse = sortedRestaurants[restaurantIndex % sortedRestaurants.length];
        restaurantIndex++;
      }

      if (placeToUse) {
        dayActivities.push({
          time: times[slot] || `${8 + slot * 3}:00 AM`,
          period: periods[slot] || 'Morning',
          placeId: placeToUse.placeId,
          notes: `Explore ${placeToUse.name} (${placeToUse.category || 'Sightseeing'})`,
          estimatedCost: placeToUse.category === 'restaurant' ? 800 : 300,
        });
      }
    }

    days.push({
      day: d,
      title: `Day ${d}: ${d === 1 ? 'Arrival & Key Highlights' : d === daysCount ? 'Final Discoveries & Sunset' : 'Coastal & Cultural Exploration'}`,
      theme: d === 1 ? 'Iconic Landmarks & Local Flavors' : 'Scenic Discoveries & Relaxation',
      activities: dayActivities,
    });
  }

  return {
    days,
    hotelRecommendations: hotels.slice(0, 4).map((h) => h.placeId),
    restaurantRecommendations: restaurants.slice(0, 5).map((r) => r.placeId),
    budgetSummary: {
      estimatedTotal: tripParams.budget?.amount || 35000 * (tripParams.numberOfDays || 3),
      accommodation: Math.round((tripParams.budget?.amount || 40000) * 0.38),
      food: Math.round((tripParams.budget?.amount || 40000) * 0.28),
      activities: Math.round((tripParams.budget?.amount || 40000) * 0.20),
      transport: Math.round((tripParams.budget?.amount || 40000) * 0.14),
      currency: 'INR',
    },
  };
};

/**
 * Modifies an existing itinerary based on user natural language instruction using Groq AI
 */
export const modifyItinerary = async ({ currentItinerary, modification, availablePlaces, tripParams }) => {
  const client = getClient();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI travel itinerary editor powered by Groq. Modify the itinerary according to the user's specific modification request.
Rules:
1. ONLY modify parts affected by the request. Keep the rest untouched.
2. ONLY use placeId values from the Available Places list. NEVER invent places.
3. Keep the same structure: { "days": [...], "hotelRecommendations": [...], "restaurantRecommendations": [...], "budgetSummary": {...}, "modificationsApplied": "Brief summary of changes made" }
4. Return valid JSON only.`,
          },
          {
            role: 'user',
            content: `User Modification: "${modification}"
Destination: ${tripParams.destination}
Duration: ${tripParams.numberOfDays} Days

Current Itinerary:
${JSON.stringify(currentItinerary, null, 2)}

Available Places:
${JSON.stringify(availablePlaces.map((p) => ({ placeId: p.placeId, name: p.name, category: p.category, rating: p.rating, priceLevel: p.priceLevel })), null, 2)}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content?.trim());
      if (parsed.days && Array.isArray(parsed.days)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[Groq Modify] Note (${err.message}). Performing targeted rule-based modification.`);
    }
  }

  return ruleBasedModifier({ currentItinerary, modification, availablePlaces });
};

/**
 * Rule-based fallback itinerary modifier
 */
const ruleBasedModifier = ({ currentItinerary, modification, availablePlaces }) => {
  const modLower = modification.toLowerCase();
  const modifiedDays = JSON.parse(JSON.stringify(currentItinerary.days || []));

  let summary = `Updated itinerary based on: "${modification}"`;

  if (modLower.includes('beach') || modLower.includes('beaches')) {
    const beachPlaces = availablePlaces.filter((p) => (p.category || '').toLowerCase().includes('beach') || p.name.toLowerCase().includes('beach'));
    if (beachPlaces.length > 0 && modifiedDays.length > 0) {
      const targetDay = modifiedDays[0];
      targetDay.activities.push({
        time: '04:00 PM',
        period: 'Evening',
        placeId: beachPlaces[0].placeId,
        notes: `Relax and enjoy sunset at ${beachPlaces[0].name}`,
        estimatedCost: 200,
      });
      summary = `Added ${beachPlaces[0].name} to Day 1`;
    }
  } else if (modLower.includes('cheaper') || modLower.includes('budget')) {
    modifiedDays.forEach((day) => {
      day.activities.forEach((act) => {
        act.estimatedCost = Math.round(act.estimatedCost * 0.75);
      });
    });
    summary = 'Reduced activity costs and selected budget-friendly options';
  } else if (modLower.includes('relax') || modLower.includes('slow')) {
    modifiedDays.forEach((day) => {
      if (day.activities.length > 2) {
        day.activities = day.activities.slice(0, 2);
      }
    });
    summary = 'Adjusted pace to relaxed with fewer activities and more leisure time';
  }

  return {
    days: modifiedDays,
    hotelRecommendations: currentItinerary.hotelRecommendations || [],
    restaurantRecommendations: currentItinerary.restaurantRecommendations || [],
    budgetSummary: currentItinerary.budgetSummary || {},
    modificationsApplied: summary,
  };
};

export default {
  parseTripRequest,
  organizeItinerary,
  modifyItinerary,
};
