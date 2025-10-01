const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { authenticateToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters')
      .optional(),
    email: z.string()
      .email('Invalid email address')
      .optional()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(6, 'Password must be at least 6 characters')
  })
});

const searchUsersSchema = z.object({
  query: z.object({
    username: z.string()
      .min(1, 'Username search term is required')
      .max(20, 'Search term too long')
  })
});

/**
 * GET /api/users/me
 * Get current authenticated user's profile
 */
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const user = global.db.prepare(`
      SELECT id, username, display_name, email, created_at
      FROM users WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/me
 * Update current user's profile
 */
router.put('/me', authenticateToken, validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    const { username, displayName, email } = req.body;
    const userId = req.user.userId;

    // Get current user data
    const currentUser = global.db.prepare(`
      SELECT id, username, display_name, email, hashed_password, role
      FROM users WHERE id = ?
    `).get(userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    // Check if username is being changed and if it's already taken
    if (username && username !== currentUser.username) {
      const existingUser = global.db.prepare(`
        SELECT id FROM users WHERE username = ? AND id != ?
      `).get(username, userId);

      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }

      updateData.username = username;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== currentUser.email) {
      const existingUser = global.db.prepare(`
        SELECT id FROM users WHERE email = ? AND id != ?
      `).get(email, userId);

      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }

      updateData.email = email;
    }

    // Update display name
    if (displayName && displayName !== currentUser.display_name) {
      updateData.display_name = displayName;
    }

    // Perform update if there are changes
    if (Object.keys(updateData).length > 0) {
      const updateFields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
      const updateValues = Object.values(updateData);
      
      global.db.prepare(`
        UPDATE users SET ${updateFields} WHERE id = ?
      `).run(...updateValues, userId);
    }

    // Return updated user data
    const updatedUser = global.db.prepare(`
      SELECT id, username, display_name, email, created_at, role
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        email: updatedUser.email,
        createdAt: updatedUser.created_at,
        role: updatedUser.role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/me/password
 * Change authenticated user's password
 */
router.put('/me/password', authenticateToken, validateRequest(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Get current user data
    const currentUser = global.db.prepare(`
      SELECT id, username, hashed_password
      FROM users WHERE id = ?
    `).get(userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, currentUser.hashed_password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    global.db.prepare(`
      UPDATE users SET hashed_password = ? WHERE id = ?
    `).run(hashedNewPassword, userId);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/me
 * Delete authenticated user's account
 */
router.delete('/me', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Start transaction
    const deleteTransaction = global.db.transaction(() => {
      // Delete user's balls (cascade will handle frames that reference these balls)
      global.db.prepare(`
        DELETE FROM balls WHERE user_id = ?
      `).run(userId);

      // Delete user's games (cascade will handle frames that reference these games)
      global.db.prepare(`
        DELETE FROM games WHERE user_id = ?
      `).run(userId);

      // Delete friend relationships
      global.db.prepare(`
        DELETE FROM friends WHERE requester_id = ? OR receiver_id = ?
      `).run(userId, userId);

      // Finally delete the user
      global.db.prepare(`
        DELETE FROM users WHERE id = ?
      `).run(userId);
    });

    deleteTransaction();

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/search
 * Search for users by username
 */
router.get('/search', authenticateToken, validateRequest(searchUsersSchema), (req, res, next) => {
  try {
    const { username } = req.query;
    const currentUserId = req.user.userId;

    // Search for users (excluding current user)
    const users = global.db.prepare(`
      SELECT id, username, display_name, created_at
      FROM users 
      WHERE username LIKE ? AND id != ?
      ORDER BY username
      LIMIT 20
    `).all(`%${username}%`, currentUserId);

    // Get friendship status for each user
    const usersWithFriendStatus = users.map(user => {
      const friendship = global.db.prepare(`
        SELECT status, requester_id
        FROM friends
        WHERE (requester_id = ? AND receiver_id = ?) 
           OR (requester_id = ? AND receiver_id = ?)
      `).get(currentUserId, user.id, user.id, currentUserId);

      let friendshipStatus = 'none';
      if (friendship) {
        if (friendship.status === 'accepted') {
          friendshipStatus = 'friends';
        } else if (friendship.status === 'pending') {
          friendshipStatus = friendship.requester_id === currentUserId ? 'sent' : 'received';
        }
      }

      return {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
        friendshipStatus
      };
    });

    res.json({
      users: usersWithFriendStatus
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;