const express = require('express');
const { z } = require('zod');
const { authenticateToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createBallSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Ball name is required')
      .max(50, 'Ball name must be less than 50 characters'),
    brand: z.string()
      .min(1, 'Brand is required')
      .max(30, 'Brand must be less than 30 characters'),
    weight: z.number()
      .int('Weight must be an integer')
      .min(6, 'Weight must be at least 6 pounds')
      .max(16, 'Weight must be at most 16 pounds'),
    color: z.string().optional(),
    image: z.string().optional(),
    coverstock: z.string().optional(),
    core_type: z.string().optional(),
    hook_potential: z.string().optional(),
    length: z.string().optional(),
    backend: z.string().optional(),
    notes: z.string().optional()
  })
});

const updateBallSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Ball name is required')
      .max(50, 'Ball name must be less than 50 characters')
      .optional(),
    brand: z.string()
      .min(1, 'Brand is required')
      .max(30, 'Brand must be less than 30 characters')
      .optional(),
    weight: z.number()
      .int('Weight must be an integer')
      .min(6, 'Weight must be at least 6 pounds')
      .max(16, 'Weight must be at most 16 pounds')
      .optional(),
    color: z.string().optional(),
    image: z.string().optional(),
    coverstock: z.string().optional(),
    core_type: z.string().optional(),
    hook_potential: z.string().optional(),
    length: z.string().optional(),
    backend: z.string().optional(),
    notes: z.string().optional()
  })
});

const ballIdSchema = z.object({
  params: z.object({
    ballId: z.string().regex(/^\d+$/, 'Ball ID must be a number').transform(Number)
  })
});

/**
 * GET /api/balls
 * Get all bowling balls for the authenticated user
 */
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const balls = global.db.prepare(`
      SELECT id, name, brand, weight, color, image, coverstock, core_type, 
             hook_potential, length, backend, notes, created_at
      FROM balls 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.userId);

    res.json({ balls });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/balls
 * Create a new bowling ball
 */
router.post('/', authenticateToken, validateRequest(createBallSchema), (req, res, next) => {
  try {
    const { name, brand, weight, color, image, coverstock, core_type, hook_potential, length, backend, notes } = req.body;
    const userId = req.user.userId;

    const insertBall = global.db.prepare(`
      INSERT INTO balls (user_id, name, brand, weight, color, image, coverstock, core_type, hook_potential, length, backend, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertBall.run(userId, name, brand, weight, color || null, image || null, 
      coverstock || null, core_type || null, hook_potential || null, length || null, backend || null, notes || null);

    // Return the created ball
    const newBall = global.db.prepare(`
      SELECT id, name, brand, weight, color, image, coverstock, core_type, 
             hook_potential, length, backend, notes, created_at
      FROM balls WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Bowling ball created successfully',
      ball: newBall
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/balls/:ballId
 * Get a specific bowling ball
 */
router.get('/:ballId', authenticateToken, validateRequest(ballIdSchema), (req, res, next) => {
  try {
    const { ballId } = req.params;
    const userId = req.user.userId;

    const ball = global.db.prepare(`
      SELECT id, name, brand, weight, color, image, coverstock, core_type, 
             hook_potential, length, backend, notes, created_at
      FROM balls 
      WHERE id = ? AND user_id = ?
    `).get(ballId, userId);

    if (!ball) {
      return res.status(404).json({ error: 'Bowling ball not found' });
    }

    res.json({ ball });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/balls/:ballId
 * Update a bowling ball
 */
router.put('/:ballId', authenticateToken, validateRequest({ ...ballIdSchema, ...updateBallSchema }), (req, res, next) => {
  try {
    const { ballId } = req.params;
    const userId = req.user.userId;

    // Check if ball exists and belongs to user
    const existingBall = global.db.prepare(`
      SELECT id FROM balls WHERE id = ? AND user_id = ?
    `).get(ballId, userId);

    if (!existingBall) {
      return res.status(404).json({ error: 'Bowling ball not found' });
    }

    // Build update query dynamically
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.brand !== undefined) updateData.brand = req.body.brand;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.image !== undefined) updateData.image = req.body.image;
    if (req.body.coverstock !== undefined) updateData.coverstock = req.body.coverstock;
    if (req.body.core_type !== undefined) updateData.core_type = req.body.core_type;
    if (req.body.hook_potential !== undefined) updateData.hook_potential = req.body.hook_potential;
    if (req.body.length !== undefined) updateData.length = req.body.length;
    if (req.body.backend !== undefined) updateData.backend = req.body.backend;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updateFields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(updateData);

    global.db.prepare(`
      UPDATE balls SET ${updateFields} WHERE id = ? AND user_id = ?
    `).run(...updateValues, ballId, userId);

    // Return updated ball
    const updatedBall = global.db.prepare(`
      SELECT id, name, brand, weight, color, image, coverstock, core_type, 
             hook_potential, length, backend, notes, created_at
      FROM balls WHERE id = ?
    `).get(ballId);

    res.json({
      message: 'Bowling ball updated successfully',
      ball: updatedBall
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/balls/:ballId
 * Delete a bowling ball
 */
router.delete('/:ballId', authenticateToken, validateRequest(ballIdSchema), (req, res, next) => {
  try {
    const { ballId } = req.params;
    const userId = req.user.userId;

    // Check if ball exists and belongs to user
    const existingBall = global.db.prepare(`
      SELECT id FROM balls WHERE id = ? AND user_id = ?
    `).get(ballId, userId);

    if (!existingBall) {
      return res.status(404).json({ error: 'Bowling ball not found' });
    }

    // Delete the ball
    global.db.prepare(`
      DELETE FROM balls WHERE id = ? AND user_id = ?
    `).run(ballId, userId);

    res.json({ message: 'Bowling ball deleted successfully' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;