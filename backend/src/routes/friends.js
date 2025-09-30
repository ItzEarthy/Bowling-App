const express = require('express');
const { z } = require('zod');
const { authenticateToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const sendRequestSchema = z.object({
  body: z.object({
    userId: z.number().int('User ID must be an integer').positive('User ID must be positive')
  })
});

const updateRequestSchema = z.object({
  body: z.object({
    status: z.enum(['accepted', 'declined'], {
      errorMap: () => ({ message: 'Status must be either "accepted" or "declined"' })
    })
  })
});

const requestIdSchema = z.object({
  params: z.object({
    requestId: z.string().regex(/^\d+$/, 'Request ID must be a number').transform(Number)
  })
});

/**
 * GET /api/friends
 * Get all accepted friends for the authenticated user
 */
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.userId;

    const friends = global.db.prepare(`
      SELECT 
        f.id as friendship_id,
        f.created_at as friends_since,
        CASE 
          WHEN f.requester_id = ? THEN u2.id
          ELSE u1.id
        END as friend_id,
        CASE 
          WHEN f.requester_id = ? THEN u2.username
          ELSE u1.username
        END as username,
        CASE 
          WHEN f.requester_id = ? THEN u2.display_name
          ELSE u1.display_name
        END as display_name,
        CASE 
          WHEN f.requester_id = ? THEN u2.created_at
          ELSE u1.created_at
        END as user_created_at
      FROM friends f
      JOIN users u1 ON f.requester_id = u1.id
      JOIN users u2 ON f.receiver_id = u2.id
      WHERE (f.requester_id = ? OR f.receiver_id = ?) 
        AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `).all(userId, userId, userId, userId, userId, userId);

    // Get basic stats for each friend
    const friendsWithStats = friends.map(friend => {
      const stats = global.db.prepare(`
        SELECT 
          COUNT(*) as total_games,
          AVG(score) as average_score,
          MAX(score) as high_score
        FROM games 
        WHERE user_id = ? AND is_complete = 1
      `).get(friend.friend_id);

      return {
        id: friend.friend_id,
        username: friend.username,
        displayName: friend.display_name,
        friendsSince: friend.friends_since,
        userCreatedAt: friend.user_created_at,
        stats: {
          totalGames: stats.total_games || 0,
          averageScore: stats.average_score ? Math.round(stats.average_score) : 0,
          highScore: stats.high_score || 0
        }
      };
    });

    res.json({ friends: friendsWithStats });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/friends/requests
 * Get all pending incoming friend requests
 */
router.get('/requests', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.userId;

    const requests = global.db.prepare(`
      SELECT 
        f.id,
        f.requester_id,
        f.created_at,
        u.username,
        u.display_name,
        u.created_at as user_created_at
      FROM friends f
      JOIN users u ON f.requester_id = u.id
      WHERE f.receiver_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId);

    // Get basic stats for each requester
    const requestsWithStats = requests.map(request => {
      const stats = global.db.prepare(`
        SELECT 
          COUNT(*) as total_games,
          AVG(score) as average_score,
          MAX(score) as high_score
        FROM games 
        WHERE user_id = ? AND is_complete = 1
      `).get(request.requester_id);

      return {
        id: request.id,
        requester: {
          id: request.requester_id,
          username: request.username,
          displayName: request.display_name,
          userCreatedAt: request.user_created_at,
          stats: {
            totalGames: stats.total_games || 0,
            averageScore: stats.average_score ? Math.round(stats.average_score) : 0,
            highScore: stats.high_score || 0
          }
        },
        createdAt: request.created_at
      };
    });

    res.json({ requests: requestsWithStats });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/friends/requests
 * Send a friend request to another user
 */
router.post('/requests', authenticateToken, validateRequest(sendRequestSchema), (req, res, next) => {
  try {
    const { userId: targetUserId } = req.body;
    const requesterId = req.user.userId;

    // Can't send request to yourself
    if (targetUserId === requesterId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if target user exists
    const targetUser = global.db.prepare(`
      SELECT id, username, display_name FROM users WHERE id = ?
    `).get(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existingFriendship = global.db.prepare(`
      SELECT id, status FROM friends
      WHERE (requester_id = ? AND receiver_id = ?) 
         OR (requester_id = ? AND receiver_id = ?)
    `).get(requesterId, targetUserId, targetUserId, requesterId);

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends with this user' });
      } else if (existingFriendship.status === 'pending') {
        return res.status(409).json({ error: 'Friend request already pending' });
      }
    }

    // Create friend request
    const insertRequest = global.db.prepare(`
      INSERT INTO friends (requester_id, receiver_id, status)
      VALUES (?, ?, 'pending')
    `);

    const result = insertRequest.run(requesterId, targetUserId);

    res.status(201).json({
      message: 'Friend request sent successfully',
      request: {
        id: result.lastInsertRowid,
        receiver: {
          id: targetUser.id,
          username: targetUser.username,
          displayName: targetUser.display_name
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/friends/requests/:requestId
 * Accept or decline a friend request
 */
router.put('/requests/:requestId', authenticateToken, validateRequest({ ...requestIdSchema, ...updateRequestSchema }), (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // Find the friend request
    const request = global.db.prepare(`
      SELECT f.*, u.username, u.display_name
      FROM friends f
      JOIN users u ON f.requester_id = u.id
      WHERE f.id = ? AND f.receiver_id = ? AND f.status = 'pending'
    `).get(requestId, userId);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }

    // Update the friend request status
    global.db.prepare(`
      UPDATE friends SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, requestId);

    res.json({
      message: `Friend request ${status} successfully`,
      request: {
        id: requestId,
        status,
        requester: {
          id: request.requester_id,
          username: request.username,
          displayName: request.display_name
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;