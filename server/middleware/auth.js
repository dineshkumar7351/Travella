import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized. Please provide a valid authentication token.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelmind_jwt_secret_production_key_super_secure_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User not found. The account may have been deleted.', 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route. Invalid or expired token.', 401));
  }
};

export default protect;
