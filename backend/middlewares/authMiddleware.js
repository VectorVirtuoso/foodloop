import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Protect routes from unauthorized users
export const protect = async (req, res, next) => {
  let token;

  // Check if the token is in the headers and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Format: "Bearer eyJhbGciOi...")
      token = req.headers.authorization.split(' ')[1];

      // Verify token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID and attach it to the request object (excluding the password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Move on to the next function/controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Role-based authorization (Crucial for FoodLoop)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // If the user's role isn't in the allowed roles array, reject them
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource` 
      });
    }
    next();
  };
};