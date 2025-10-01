const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { validateRequest } = require('../middleware/auth');

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
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = global.db.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).get(email, username);

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email or username already exists' 
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.lastInsertRowid,
        username: username,
        email: email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastInsertRowid,
        username,
        displayName,
        email
      },
      token
    });

  } catch (error) {
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

    // Find user by email or username
    const user = global.db.prepare(`
      SELECT id, username, display_name, email, hashed_password, role
      FROM users WHERE email = ? OR username = ?
    `).get(emailOrUsername, emailOrUsername);

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email/username or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email/username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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
      token
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;