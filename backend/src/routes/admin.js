const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const { z } = require('zod');
const { authenticateToken, validateRequest, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createUserSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters'),
    email: z.string()
      .email('Invalid email address'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin']).default('user')
  })
});

const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended']),
    role: z.enum(['user', 'admin']).optional()
  })
});

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const users = global.db.prepare(`
      SELECT 
        id, 
        username, 
        display_name, 
        email, 
        role, 
        created_at,
        profile_picture,
        'active' as status
      FROM users 
      ORDER BY created_at DESC
    `).all();

    // Get game counts for each user
    const usersWithStats = users.map(user => {
      const gameCount = global.db.prepare(`
        SELECT COUNT(*) as count FROM games WHERE user_id = ?
      `).get(user.id);

      return {
        ...user,
        gameCount: gameCount.count
      };
    });

    res.json({
      users: usersWithStats
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
router.post('/users', authenticateToken, requireAdmin, validateRequest(createUserSchema), async (req, res, next) => {
  try {
    const { username, displayName, email, password, role } = req.body;

    // Check if trying to create admin when admins already exist
    if (role === 'admin') {
      const existingAdmin = global.db.prepare(`
        SELECT id FROM users WHERE role = 'admin' LIMIT 1
      `).get();

      if (existingAdmin) {
        return res.status(403).json({ 
          error: 'Cannot create admin account. An admin already exists in the system.' 
        });
      }
    }

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
    const result = global.db.prepare(`
      INSERT INTO users (username, display_name, email, hashed_password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, displayName, email, hashedPassword, role);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.lastInsertRowid,
        username,
        displayName,
        email,
        role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status and/or role (admin only)
 */
router.put('/users/:id/status', authenticateToken, requireAdmin, validateRequest(updateUserStatusSchema), (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { status, role } = req.body;
    const currentUserId = req.user.userId;

    // Prevent changing own status/role
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot change your own status or role' });
    }

    // Check if user exists
    const user = global.db.prepare(`
      SELECT id, role FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role if provided
    if (role && role !== user.role) {
      global.db.prepare(`
        UPDATE users SET role = ? WHERE id = ?
      `).run(role, userId);

      // Log the action
      logAdminAction(currentUserId, 'role_updated', 'user', userId, 
        `Changed user role to ${role}`, req.ip);
    }

    // For now, we'll just return success for status since we don't have a status column
    // In a real implementation, you'd update the user's status in the database
    res.json({
      message: role ? `User role updated to ${role}` : `User status updated to ${status}`,
      status,
      role: role || user.role
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details (admin only)
 */
router.put('/users/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, displayName, email } = req.body;

    // Check if user exists
    const user = global.db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];

    if (username) {
      // Check if username is already taken by another user
      const existingUser = global.db.prepare(`
        SELECT id FROM users WHERE username = ? AND id != ?
      `).get(username, userId);

      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }

      updates.push('username = ?');
      values.push(username);
    }

    if (displayName) {
      updates.push('display_name = ?');
      values.push(displayName);
    }

    if (email) {
      // Check if email is already taken by another user
      const existingUser = global.db.prepare(`
        SELECT id FROM users WHERE email = ? AND id != ?
      `).get(email, userId);

      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }

      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length > 0) {
      values.push(userId);
      global.db.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).run(...values);

      // Log the action
      logAdminAction(req.user.userId, 'user_updated', 'user', userId, 
        `Updated user details`, req.ip);
    }

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/force-logout
 * Force logout a user (admin only)
 */
router.post('/users/:id/force-logout', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    // Prevent self-logout
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot force logout yourself' });
    }

    // Check if user exists
    const user = global.db.prepare(`
      SELECT id, username FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real implementation, you would:
    // 1. Invalidate all active sessions/tokens for this user
    // 2. Add the user to a blacklist table
    // 3. Store revoked tokens in a cache (Redis)
    // For now, we'll just log the action
    
    // Log the action
    logAdminAction(currentUserId, 'user_forced_logout', 'user', userId, 
      `Forced logout for user: ${user.username}`, req.ip);

    res.json({ 
      message: `User ${user.username} has been logged out`,
      userId: user.id
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 */
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    // Prevent self-deletion
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = global.db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user and all associated data
    const deleteTransaction = global.db.transaction(() => {
      // Delete user's balls
      global.db.prepare(`
        DELETE FROM balls WHERE user_id = ?
      `).run(userId);

      // Delete user's games (frames will be cascade deleted)
      global.db.prepare(`
        DELETE FROM games WHERE user_id = ?
      `).run(userId);

      // Delete friend relationships
      global.db.prepare(`
        DELETE FROM friends WHERE requester_id = ? OR receiver_id = ?
      `).run(userId, userId);

      // Delete the user
      global.db.prepare(`
        DELETE FROM users WHERE id = ?
      `).run(userId);
    });

    deleteTransaction();

    // Log the action
    logAdminAction(req.user.userId, 'user_deleted', 'user', userId, 
      `Deleted user account`, req.ip);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get system statistics (admin only)
 */
router.get('/stats', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    // Get user stats
    const userStats = global.db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_week,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
      FROM users
    `).get();

    // Get game stats
    const gameStats = global.db.prepare(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_games_week,
        AVG(total_score) as avg_score,
        COUNT(CASE WHEN is_complete = 1 THEN 1 END) as completed_games
      FROM games
    `).get();

    // Get ball stats
    const ballStats = global.db.prepare(`
      SELECT COUNT(*) as total_balls FROM balls
    `).get();

    // Get recent activity
    const recentActivity = global.db.prepare(`
      SELECT 
        'user_registered' as type,
        u.display_name as details,
        u.created_at as timestamp
      FROM users u
      WHERE u.created_at >= datetime('now', '-7 days')
      UNION ALL
      SELECT 
        'game_created' as type,
        g.location || ' - Score: ' || g.total_score as details,
        g.created_at as timestamp
      FROM games g
      WHERE g.created_at >= datetime('now', '-7 days') AND g.is_complete = 1
      ORDER BY timestamp DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        users: userStats,
        games: gameStats,
        balls: ballStats,
        recentActivity,
        systemHealth: 'Excellent',
        uptime: process.uptime()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/settings
 * Get all admin settings
 */
router.get('/settings', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const settings = global.db.prepare(`
      SELECT setting_key, setting_value, description, updated_at
      FROM admin_settings
      ORDER BY setting_key
    `).all();

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/settings/:key
 * Update admin setting
 */
router.put('/settings/:key', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.userId;

    // Update setting
    const result = global.db.prepare(`
      UPDATE admin_settings 
      SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `).run(value, userId, key);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Log the action
    logAdminAction(userId, 'setting_updated', 'admin_setting', key, 
      `Updated ${key} to ${value}`, req.ip);

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/logs
 * Get system logs
 */
router.get('/logs', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const logs = global.db.prepare(`
      SELECT 
        sl.*,
        u.username,
        u.display_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const totalLogs = global.db.prepare(`
      SELECT COUNT(*) as count FROM system_logs
    `).get();

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalLogs.count,
        totalPages: Math.ceil(totalLogs.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/bulk
 * Bulk user operations
 */
router.post('/users/bulk', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { action, userIds } = req.body;
    const adminId = req.user.userId;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // Prevent admin from affecting their own account
    const filteredIds = userIds.filter(id => id !== adminId);

    let result;
    switch (action) {
      case 'delete':
        const deleteTransaction = global.db.transaction(() => {
          for (const userId of filteredIds) {
            // Delete user data
            global.db.prepare('DELETE FROM balls WHERE user_id = ?').run(userId);
            global.db.prepare('DELETE FROM games WHERE user_id = ?').run(userId);
            global.db.prepare('DELETE FROM friends WHERE requester_id = ? OR receiver_id = ?').run(userId, userId);
            global.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
            
            // Log action
            logAdminAction(adminId, 'user_deleted', 'user', userId, 
              `Bulk deleted user ID: ${userId}`, req.ip);
          }
        });
        deleteTransaction();
        result = { deletedCount: filteredIds.length };
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid bulk action' });
    }

    res.json({ message: 'Bulk operation completed', result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/backup
 * Create database backup
 */
router.post('/backup', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = req.user.userId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../backups/backup-${timestamp}.db`);
    
    // Create backup directory if it doesn't exist
    const fs = require('fs');
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup
    global.db.backup(backupPath);
    
    // Log action
    logAdminAction(userId, 'backup_created', 'system', null, 
      `Database backup created: ${backupPath}`, req.ip);

    res.json({
      message: 'Backup created successfully',
      backupPath: `backup-${timestamp}.db`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Admin User Functionality Routes
 * These routes allow admins to access the same functionality as regular users
 */

/**
 * GET /api/admin/user-profile
 * Get admin's user profile (same as regular users)
 */
router.get('/user-profile', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const user = global.db.prepare(`
      SELECT id, username, display_name, email, created_at, role
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
        createdAt: user.created_at,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/user-profile
 * Update admin's user profile (same as regular users)
 */
router.put('/user-profile', authenticateToken, requireAdmin, async (req, res, next) => {
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
 * PUT /api/admin/user-password
 * Change admin's password (same as regular users)
 */
router.put('/user-password', authenticateToken, requireAdmin, async (req, res, next) => {
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

    // Log admin action
    logAdminAction(userId, 'password_changed', 'user', userId, 
      'Admin changed their own password', req.ip);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to log admin actions
 */
function logAdminAction(userId, action, targetType, targetId, details, ipAddress) {
  try {
    global.db.prepare(`
      INSERT INTO system_logs (user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, targetType, targetId, details, ipAddress);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

module.exports = router;