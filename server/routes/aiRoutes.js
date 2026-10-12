import express from 'express';
import {
  parseTrip,
  generateItinerary,
  modifyItineraryHandler,
} from '../controllers/aiController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Allow public parsing & generation or protected based on token
router.post('/parse-trip', parseTrip);
router.post('/generate-itinerary', generateItinerary);
router.post('/modify-itinerary', protect, modifyItineraryHandler);

export default router;
