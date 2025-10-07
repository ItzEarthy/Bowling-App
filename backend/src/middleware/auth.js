const jwt = require('jsonwebtoken');
const { z } = require('zod');
const logger = require('../utils/logger');
const { securityLogger } = require('./logging');

/**
 * Authentication middleware to verify JWT tokens
 * Protects routes that require user authentication
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    securityLogger.logInvalidToken(req);
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET environment variable is not set', {
      correlationId: req.correlationId,
      url: req.originalUrl
    });
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.debug('Token verification failed', {
        error: err.message,
        correlationId: req.correlationId,
        url: req.originalUrl,
        ip: req.get('X-Real-IP') || req.ip
      });
      
      if (err.name === 'TokenExpiredError') {
        securityLogger.logInvalidToken(req);
        return res.status(401).json({ error: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        securityLogger.logInvalidToken(req);
        return res.status(403).json({ error: 'Invalid token' });
      } else {
        securityLogger.logInvalidToken(req);
        return res.status(403).json({ error: 'Token verification failed' });
      }
    }
    
    req.user = user;
    logger.debug('User authenticated', {
      userId: user.userId,
      correlationId: req.correlationId,
      url: req.originalUrl
    });
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
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role
 */
const requireAdmin = (req, res, next) => {
  // Check if user is authenticated (should be set by authenticateToken middleware)
  if (!req.user) {
    securityLogger.logPermissionDenied(req, 'admin_access');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Get user from database to check role
  const user = global.db.prepare(`
    SELECT role FROM users WHERE id = ?
  `).get(req.user.userId);

  if (!user || user.role !== 'admin') {
    securityLogger.logPermissionDenied(req, 'admin_access');
    logger.warn('Admin access denied', {
      userId: req.user.userId,
      correlationId: req.correlationId,
      url: req.originalUrl,
      userRole: user?.role || 'none'
    });
    return res.status(403).json({ error: 'Admin access required' });
  }

  logger.debug('Admin access granted', {
    userId: req.user.userId,
    correlationId: req.correlationId,
    url: req.originalUrl
  });
  
  next();
};

/**
 * Global error handling middleware
 * Catches all errors and sends standardized JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // Error details are already logged by errorLogger middleware
  logger.error('Request failed', {
    message: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId
  });

  // Database constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ 
      error: 'A resource with this information already exists',
      correlationId: req.correlationId
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    // Map foreign key violations to 400 Bad Request with a helpful message
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({ 
        error: 'Invalid foreign key value provided',
        correlationId: req.correlationId
      });
    }

    return res.status(500).json({ 
      error: 'Database operation failed',
      correlationId: req.correlationId
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid authentication token',
      correlationId: req.correlationId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Authentication token expired',
      correlationId: req.correlationId
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    correlationId: req.correlationId
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    correlationId: req.correlationId,
    ip: req.get('X-Real-IP') || req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Route not found',
    correlationId: req.correlationId
  });
};

module.exports = {
  authenticateToken,
  validateRequest,
  requireAdmin,
  errorHandler,
  notFoundHandler
};