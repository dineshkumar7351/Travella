import express from 'express';
import { calculateRoute, planRoute, getPlacesAlongRoute, quickRoute } from '../controllers/routesController.js';

const router = express.Router();

router.post('/calculate', calculateRoute);
router.post('/plan', planRoute);
router.post('/along-route', getPlacesAlongRoute);
router.post('/quick-route', quickRoute);

export default router;
