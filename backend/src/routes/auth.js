const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { validateRequest } = require('../middleware/auth');
const logger = require('../utils/logger');
const { securityLogger } = require('../middleware/logging');

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters')
  })
});

const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required')
  })
});

/**
 * GET /api/auth/health
 * Health check endpoint for authentication service
 */
router.get('/health', (req, res) => {
  logger.debug('Auth health check', { correlationId: req.correlationId });
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth',
    version: '1.0.0',
    correlationId: req.correlationId
  });
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, username, password, displayName } = req.body;

    logger.info('User registration attempt', {
      email,
      username,
      correlationId: req.correlationId,
      ip: req.get('X-Real-IP') || req.ip
    });

    // Check if user already exists
    const existingUser = global.db.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).get(email, username);

    if (existingUser) {
      logger.warn('Registration failed - user exists', {
        email,
        username,
        correlationId: req.correlationId
      });
      return res.status(409).json({ 
        error: 'User with this email or username already exists',
        correlationId: req.correlationId
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const insertUser = global.db.prepare(`
      INSERT INTO users (email, username, display_name, hashed_password)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertUser.run(email, username, displayName, hashedPassword);

    // Generate JWT token with longer expiration
    const token = jwt.sign(
      { 
        userId: result.lastInsertRowid,
        username: username,
        email: email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Extended to 30 days
    );

    securityLogger.logSuccessfulLogin(req, result.lastInsertRowid);
    
    logger.info('User registered successfully', {
      userId: result.lastInsertRowid,
      username,
      email,
      correlationId: req.correlationId
    });

    // Return user data (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastInsertRowid,
        username,
        displayName,
        email
      },
      token,
      correlationId: req.correlationId
    });

  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      correlationId: req.correlationId
    });
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    logger.info('Login attempt', {
      identifier: emailOrUsername,
      correlationId: req.correlationId,
      ip: req.get('X-Real-IP') || req.ip
    });

    // Find user by email or username
    const user = global.db.prepare(`
      SELECT id, username, display_name, email, hashed_password, role
      FROM users WHERE email = ? OR username = ?
    `).get(emailOrUsername, emailOrUsername);

    if (!user) {
      securityLogger.logFailedLogin(req, emailOrUsername);
      logger.warn('Login failed - user not found', {
        identifier: emailOrUsername,
        correlationId: req.correlationId
      });
      return res.status(401).json({ 
        error: 'Invalid email/username or password',
        correlationId: req.correlationId
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);

    if (!isValidPassword) {
      securityLogger.logFailedLogin(req, emailOrUsername);
      logger.warn('Login failed - invalid password', {
        userId: user.id,
        identifier: emailOrUsername,
        correlationId: req.correlationId
      });
      return res.status(401).json({ 
        error: 'Invalid email/username or password',
        correlationId: req.correlationId
      });
    }

    // Generate JWT token with longer expiration
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Extended to 30 days
    );

    securityLogger.logSuccessfulLogin(req, user.id);
    
    logger.info('Login successful', {
      userId: user.id,
      username: user.username,
      correlationId: req.correlationId
    });

    // Return user data (without password)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role
      },
      token,
      correlationId: req.correlationId
    });

  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      correlationId: req.correlationId
    });
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh an existing JWT token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Token refresh failed - no token', {
        correlationId: req.correlationId,
        ip: req.get('X-Real-IP') || req.ip
      });
      return res.status(401).json({ 
        error: 'Access token required',
        correlationId: req.correlationId
      });
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set', {
        correlationId: req.correlationId
      });
      return res.status(500).json({ 
        error: 'Server configuration error',
        correlationId: req.correlationId
      });
    }

    // Verify the existing token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If token is expired, try to decode without verification to get user data
      if (err.name === 'TokenExpiredError') {
        try {
          decoded = jwt.decode(token);
          logger.debug('Refreshing expired token', {
            userId: decoded?.userId,
            correlationId: req.correlationId
          });
        } catch (decodeErr) {
          logger.warn('Token refresh failed - invalid format', {
            correlationId: req.correlationId,
            error: decodeErr.message
          });
          return res.status(401).json({ 
            error: 'Invalid token format',
            correlationId: req.correlationId
          });
        }
      } else {
        logger.warn('Token refresh failed - invalid token', {
          correlationId: req.correlationId,
          error: err.message
        });
        return res.status(401).json({ 
          error: 'Invalid token',
          correlationId: req.correlationId
        });
      }
    }

    if (!decoded || !decoded.userId) {
      logger.warn('Token refresh failed - invalid payload', {
        correlationId: req.correlationId
      });
      return res.status(401).json({ 
        error: 'Invalid token payload',
        correlationId: req.correlationId
      });
    }

    // Verify user still exists and is active
    const user = global.db.prepare(`
      SELECT id, username, display_name, email, role, status
      FROM users WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      logger.warn('Token refresh failed - user not found', {
        userId: decoded.userId,
        correlationId: req.correlationId
      });
      return res.status(401).json({ 
        error: 'User not found',
        correlationId: req.correlationId
      });
    }

    if (user.status === 'suspended') {
      logger.warn('Token refresh failed - user suspended', {
        userId: decoded.userId,
        correlationId: req.correlationId
      });
      return res.status(401).json({ 
        error: 'User account suspended',
        correlationId: req.correlationId
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    securityLogger.logTokenRefresh(req, user.id);
    
    logger.info('Token refreshed successfully', {
      userId: user.id,
      correlationId: req.correlationId
    });

    res.json({
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role
      },
      token: newToken,
      correlationId: req.correlationId
    });

  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
      correlationId: req.correlationId
    });
    next(error);
  }
});

module.exports = router;