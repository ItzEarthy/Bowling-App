const jwt = require('jsonwebtoken');
const { z } = require('zod');

/**
 * Authentication middleware to verify JWT tokens
 * Protects routes that require user authentication
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

/**
 * Validation middleware factory using Zod schemas
 * @param {Object} schemas - Object containing body, query, and params schemas
 * @returns {Function} Express middleware function
 */
const validateRequest = (schemas) => {
  return (req, res, next) => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // Validate URL parameters
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Global error handling middleware
 * Catches all errors and sends standardized JSON responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ 
      error: 'A resource with this information already exists' 
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({ 
      error: 'Database operation failed' 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid authentication token' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Authentication token expired' 
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
};

module.exports = {
  authenticateToken,
  validateRequest,
  errorHandler,
  notFoundHandler
};