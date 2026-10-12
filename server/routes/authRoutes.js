import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

export default router;
