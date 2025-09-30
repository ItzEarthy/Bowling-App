const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { authenticateToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters')
      .optional(),
    currentPassword: z.string().min(1, 'Current password is required').optional(),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
      .optional()
  }).refine(data => {
    // If newPassword is provided, currentPassword must also be provided
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: 'Current password is required when changing password'
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
    const { displayName, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Get current user data
    const currentUser = global.db.prepare(`
      SELECT hashed_password FROM users WHERE id = ?
    `).get(userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateData = {};
    
    // Update display name if provided
    if (displayName) {
      updateData.display_name = displayName;
    }

    // Update password if provided
    if (newPassword && currentPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.hashed_password);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.hashed_password = await bcrypt.hash(newPassword, saltRounds);
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
      SELECT id, username, display_name, email, created_at
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        email: updatedUser.email,
        createdAt: updatedUser.created_at
      }
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