import express from 'express';
import {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All trip routes require authentication
router.use(protect);

router.route('/')
  .post(createTrip)
  .get(getTrips);

router.route('/:id')
  .get(getTrip)
  .put(updateTrip)
  .delete(deleteTrip);

export default router;
