import express from 'express';
import { searchPlaces, getPlacePhoto } from '../controllers/placesController.js';

const router = express.Router();

router.post('/search', searchPlaces);
router.get('/photo/*', getPlacePhoto);

export default router;
