const express = require('express');
const { z } = require('zod');
const { authenticateToken, validateRequest } = require('../middleware/auth');
const BowlingScoreService = require('../services/bowlingScore');

const router = express.Router();
const scoreService = new BowlingScoreService();

// Validation schemas
const createGameSchema = z.object({
  body: z.object({
    ball_id: z.number().int('Ball ID must be an integer').optional(),
    location: z.string().max(100, 'Location must be less than 100 characters').optional()
  })
});

const submitCompleteGameSchema = z.object({
  body: z.object({
    ball_id: z.number().int('Ball ID must be an integer').optional(),
    location: z.string().max(100, 'Location must be less than 100 characters').optional(),
    entryMode: z.enum(['final_score', 'frame_by_frame', 'pin_by_pin']).default('pin_by_pin'),
    totalScore: z.number().int().min(0).max(300).optional(),
    strikes: z.number().int().min(0).max(12).optional(),
    spares: z.number().int().min(0).max(10).optional(),
    notes: z.string().optional(),
    frames: z.array(z.object({
      frame_number: z.number().int().min(1).max(10),
      throws: z.array(z.number().int().min(0).max(10)).optional(),
      cumulative_score: z.number().int().min(0).optional(),
      is_complete: z.boolean().optional(),
      score: z.number().int().min(0).optional() // For frame-by-frame entry
    })).optional(),
    is_complete: z.boolean().optional(),
    created_at: z.string().optional(),
    timestamp: z.string().optional()
  }).refine((data) => {
    // Validation based on entry mode
    if (data.entryMode === 'final_score') {
      // For final score entry, totalScore is required
      if (!data.totalScore) {
        throw new Error('Total score is required for final_score entry mode');
      }
      // Validate strikes + spares don't exceed 10 frames
      const strikes = data.strikes || 0;
      const spares = data.spares || 0;
      if (strikes + spares > 10) {
        throw new Error('Strikes + spares cannot exceed 10 frames');
      }
    } else if (data.entryMode === 'frame_by_frame' || data.entryMode === 'pin_by_pin') {
      // For frame-by-frame or pin-by-pin, frames data is required
      if (!data.frames || data.frames.length === 0) {
        throw new Error('Frames data is required for frame_by_frame and pin_by_pin entry modes');
      }
    }
    return true;
  }, {
    message: "Invalid data for the specified entry mode"
  })
});

const gameIdSchema = z.object({
  params: z.object({
    gameId: z.string().regex(/^\d+$/, 'Game ID must be a number').transform(Number)
  })
});

const submitFrameSchema = z.object({
  body: z.object({
    frameNumber: z.number().int('Frame number must be an integer').min(1).max(10),
    throws: z.array(z.number().int('Each throw must be an integer').min(0).max(10))
      .min(1, 'At least one throw is required')
      .max(3, 'Maximum 3 throws allowed')
  })
});

const gamesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional()
  })
});

/**
 * POST /api/games
 * Create a new game session
 */
router.post('/', authenticateToken, validateRequest(submitCompleteGameSchema), (req, res, next) => {
  try {
    const { 
      ball_id, 
      location, 
      entryMode, 
      totalScore, 
      strikes, 
      spares, 
      notes, 
      frames, 
      is_complete, 
      created_at,
      timestamp 
    } = req.body;
    const userId = req.user.userId;

    // Ensure the user exists in the database (defend against tokens referring to deleted users)
    const existingUser = global.db.prepare(`SELECT id FROM users WHERE id = ?`).get(Number(userId));
    if (!existingUser) {
      return res.status(401).json({ error: 'Authenticated user not found' });
    }

    // Validate ball ownership if ball_id is provided
    if (ball_id) {
      const ball = global.db.prepare(`
        SELECT id FROM balls WHERE id = ? AND user_id = ?
      `).get(ball_id, userId);

      if (!ball) {
        return res.status(400).json({ error: 'Invalid ball ID or ball does not belong to user' });
      }
    }

    // Create new game
    const insertGame = global.db.prepare(`
      INSERT INTO games (
        user_id, 
        ball_id, 
        location, 
        total_score, 
        strikes, 
        spares, 
        notes, 
        entry_mode, 
        is_complete, 
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Normalize values to types supported by better-sqlite3 (numbers, strings, bigints, buffers, null)
    const gameCreatedAt = created_at || timestamp || new Date().toISOString();
    const gameIsComplete = Number(Boolean(is_complete));
    const gameTotalScore = typeof totalScore === 'number' ? totalScore : (totalScore ? Number(totalScore) : 0);
    const gameStrikes = typeof strikes === 'number' ? strikes : (strikes ? Number(strikes) : 0);
    const gameSpares = typeof spares === 'number' ? spares : (spares ? Number(spares) : 0);

    console.log('Game insert values:', {
      userId,
      ball_id: ball_id || null,
      location: location || null,
      gameTotalScore,
      gameStrikes,
      gameSpares,
      notes: notes || null,
      entryMode: entryMode || 'pin_by_pin',
      gameIsComplete,
      gameCreatedAt
    });

    let result;
    try {
      // Ensure types are valid for sqlite binding
      result = insertGame.run(
        Number(userId),
        ball_id != null ? Number(ball_id) : null,
        location != null ? String(location) : null,
        Number(gameTotalScore),
        Number(gameStrikes),
        Number(gameSpares),
        notes != null ? String(notes) : null,
        entryMode != null ? String(entryMode) : 'pin_by_pin',
        Number(gameIsComplete),
        String(gameCreatedAt)
      );
    } catch (err) {
      // Let the error handler provide structured responses, but add some context
      err.message = `Failed to create game: ${err.message}`;
      return next(err);
    }
    const gameId = result.lastInsertRowid;

    // Handle frames data based on entry mode
    if (entryMode === 'final_score') {
      // For final score entry, create minimal frame data if not provided
      if (!frames || frames.length === 0) {
        const insertFrame = global.db.prepare(`
          INSERT INTO frames (game_id, frame_number, throws_data, cumulative_score, is_complete)
          VALUES (?, ?, ?, ?, ?)
        `);

        // Create 10 empty frames for final score entry
        for (let i = 1; i <= 10; i++) {
          insertFrame.run(Number(gameId), i, JSON.stringify([]), 0, 1); // Mark as complete since it's final score
        }
      } else {
        // Use provided frames data
        const insertFrame = global.db.prepare(`
          INSERT INTO frames (game_id, frame_number, throws_data, cumulative_score, is_complete)
          VALUES (?, ?, ?, ?, ?)
        `);

        frames.forEach(frame => {
          const throwsData = frame.throws || [];
          const cumulativeScore = frame.cumulative_score || 0;
          const frameIsComplete = 1; // Always complete for final score

          insertFrame.run(
            Number(gameId),
            Number(frame.frame_number),
            JSON.stringify(throwsData),
            Number(cumulativeScore),
            Number(frameIsComplete)
          );
        });
      }
    } else if (frames && frames.length > 0) {
      // Insert provided frames for frame_by_frame or pin_by_pin modes
      const insertFrame = global.db.prepare(`
        INSERT INTO frames (game_id, frame_number, throws_data, cumulative_score, is_complete)
        VALUES (?, ?, ?, ?, ?)
      `);

      frames.forEach(frame => {
        const throwsData = frame.throws || [];
        const cumulativeScore = frame.cumulative_score || 0;
        const frameIsComplete = frame.is_complete ? 1 : 0;

        insertFrame.run(
          Number(gameId),
          Number(frame.frame_number),
          JSON.stringify(throwsData),
          Number(cumulativeScore),
          Number(frameIsComplete)
        );
      });
    } else {
      // Create empty frames for the game (pin_by_pin or frame_by_frame without frames data)
      const insertFrame = global.db.prepare(`
        INSERT INTO frames (game_id, frame_number, throws_data, cumulative_score, is_complete)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (let i = 1; i <= 10; i++) {
        insertFrame.run(Number(gameId), i, JSON.stringify([]), 0, 0);
      }
    }

    // Get the complete game data
    const game = global.db.prepare(`
      SELECT g.*, b.name as ball_name, b.brand as ball_brand, b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.id = ?
    `).get(gameId);

    const gameFrames = global.db.prepare(`
      SELECT * FROM frames WHERE game_id = ? ORDER BY frame_number
    `).all(gameId);

    res.status(201).json({
      message: 'Game saved successfully',
      game: {
        id: game.id,
        user_id: game.user_id,
        ball: game.ball_id ? {
          id: game.ball_id,
          name: game.ball_name,
          brand: game.ball_brand,
          weight: game.ball_weight
        } : null,
        location: game.location,
        total_score: game.total_score,
        strikes: game.strikes,
        spares: game.spares,
        notes: game.notes,
        entry_mode: game.entry_mode,
        is_complete: Boolean(game.is_complete),
        created_at: game.created_at,
        frames: gameFrames.map(frame => ({
          id: frame.id,
          frame_number: frame.frame_number,
          throws: JSON.parse(frame.throws_data),
          cumulative_score: frame.cumulative_score,
          is_complete: Boolean(frame.is_complete)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/games
 * Get paginated list of user's games
 */
router.get('/', authenticateToken, validateRequest(gamesQuerySchema), (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = req.query.page || 1;
    const limit = Math.min(req.query.limit || 20, 50); // Max 50 games per request
    const offset = (page - 1) * limit;

    // Get total count
    const totalCount = global.db.prepare(`
      SELECT COUNT(*) as count FROM games WHERE user_id = ?
    `).get(userId).count;

    // Get games with ball info
    const games = global.db.prepare(`
      SELECT g.*, b.name as ball_name, b.brand as ball_brand, b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const gamesWithDetails = games.map(game => ({
      id: game.id,
      ball: game.ball_id ? {
        id: game.ball_id,
        name: game.ball_name,
        brand: game.ball_brand,
        weight: game.ball_weight
      } : null,
      location: game.location,
      score: game.score,
      total_score: game.total_score,
      strikes: game.strikes,
      spares: game.spares,
      notes: game.notes,
      entry_mode: game.entry_mode,
      is_complete: Boolean(game.is_complete),
      created_at: game.created_at
    }));

    res.json({
      games: gamesWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/games/:gameId
 * Get detailed game information including all frames
 */
router.get('/:gameId', authenticateToken, validateRequest(gameIdSchema), (req, res, next) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.userId;

    // Get game with ball info
    const game = global.db.prepare(`
      SELECT g.*, b.name as ball_name, b.brand as ball_brand, b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.id = ? AND g.user_id = ?
    `).get(gameId, userId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get all frames for the game
    const frames = global.db.prepare(`
      SELECT * FROM frames WHERE game_id = ? ORDER BY frame_number
    `).all(gameId);

    res.json({
      game: {
        id: game.id,
        user_id: game.user_id,
        ball: game.ball_id ? {
          id: game.ball_id,
          name: game.ball_name,
          brand: game.ball_brand,
          weight: game.ball_weight
        } : null,
        location: game.location,
        score: game.score,
        total_score: game.total_score,
        strikes: game.strikes,
        spares: game.spares,
        notes: game.notes,
        entry_mode: game.entry_mode,
        is_complete: Boolean(game.is_complete),
        created_at: game.created_at,
        frames: frames.map(frame => ({
          id: frame.id,
          frame_number: frame.frame_number,
          throws: JSON.parse(frame.throws_data),
          cumulative_score: frame.cumulative_score,
          is_complete: Boolean(frame.is_complete)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/games/:gameId/frames
 * Submit throws for a specific frame
 */
router.post('/:gameId/frames', authenticateToken, validateRequest({ ...gameIdSchema, ...submitFrameSchema }), (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { frameNumber, throws } = req.body;
    const userId = req.user.userId;

    // Verify game ownership
    const game = global.db.prepare(`
      SELECT id, is_complete FROM games WHERE id = ? AND user_id = ?
    `).get(gameId, userId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.is_complete) {
      return res.status(400).json({ error: 'Cannot modify completed game' });
    }

    // Validate throws
    const validation = scoreService.validateThrows(throws, frameNumber);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check if frame is complete
    const isComplete = scoreService.isFrameComplete(throws, frameNumber);

    // Update frame
    global.db.prepare(`
      UPDATE frames 
      SET throws_data = ?, is_complete = ?
      WHERE game_id = ? AND frame_number = ?
    `).run(JSON.stringify(throws), isComplete ? 1 : 0, gameId, frameNumber);

    // Recalculate scores for all frames
    const allFrames = global.db.prepare(`
      SELECT * FROM frames WHERE game_id = ? ORDER BY frame_number
    `).all(gameId);

    const updatedFrames = scoreService.calculateGameScore(allFrames);

    // Update frame cumulative scores
    const updateFrameScore = global.db.prepare(`
      UPDATE frames SET cumulative_score = ? WHERE id = ?
    `);

    updatedFrames.forEach(frame => {
      updateFrameScore.run(frame.cumulative_score, frame.id);
    });

    // Check if game is complete (all frames complete)
    const completedFrames = updatedFrames.filter(frame => 
      scoreService.isFrameComplete(JSON.parse(frame.throws_data), frame.frame_number)
    );

    const gameComplete = completedFrames.length === 10;
    const finalScore = gameComplete ? updatedFrames[9].cumulative_score : 0;

    // Update game completion status and score
    global.db.prepare(`
      UPDATE games SET score = ?, total_score = ?, is_complete = ? WHERE id = ?
    `).run(finalScore, finalScore, gameComplete ? 1 : 0, gameId);

    // Return updated game state
    const updatedGame = global.db.prepare(`
      SELECT g.*, b.name as ball_name, b.brand as ball_brand, b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.id = ?
    `).get(gameId);

    const currentFrames = global.db.prepare(`
      SELECT * FROM frames WHERE game_id = ? ORDER BY frame_number
    `).all(gameId);

    res.json({
      message: 'Frame updated successfully',
      game: {
        id: updatedGame.id,
        user_id: updatedGame.user_id,
        ball: updatedGame.ball_id ? {
          id: updatedGame.ball_id,
          name: updatedGame.ball_name,
          brand: updatedGame.ball_brand,
          weight: updatedGame.ball_weight
        } : null,
        location: updatedGame.location,
        score: updatedGame.score,
        total_score: updatedGame.total_score,
        strikes: updatedGame.strikes,
        spares: updatedGame.spares,
        notes: updatedGame.notes,
        entry_mode: updatedGame.entry_mode,
        is_complete: Boolean(updatedGame.is_complete),
        created_at: updatedGame.created_at,
        frames: currentFrames.map(frame => ({
          id: frame.id,
          frame_number: frame.frame_number,
          throws: JSON.parse(frame.throws_data),
          cumulative_score: frame.cumulative_score,
          is_complete: Boolean(frame.is_complete)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/games/:id
 * Update a game (date, location, notes, etc.)
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { location, notes, created_at } = req.body;

    // Verify game exists and belongs to user
    const game = global.db.prepare(`
      SELECT id, user_id FROM games WHERE id = ? AND user_id = ?
    `).get(gameId, userId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    const updateData = {};
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (created_at !== undefined) updateData.created_at = created_at;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Perform update
    const updateFields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    
    global.db.prepare(`
      UPDATE games SET ${updateFields} WHERE id = ? AND user_id = ?
    `).run(...updateValues, gameId, userId);

    // Return updated game
    const updatedGame = global.db.prepare(`
      SELECT 
        g.*,
        b.name as ball_name,
        b.brand as ball_brand,
        b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.id = ? AND g.user_id = ?
    `).get(gameId, userId);

    res.json({
      message: 'Game updated successfully',
      game: {
        id: updatedGame.id,
        userId: updatedGame.user_id,
        ballId: updatedGame.ball_id,
        location: updatedGame.location,
        totalScore: updatedGame.total_score,
        strikes: updatedGame.strikes,
        spares: updatedGame.spares,
        entryMode: updatedGame.entry_mode,
        isComplete: Boolean(updatedGame.is_complete),
        notes: updatedGame.notes,
        createdAt: updatedGame.created_at,
        updatedAt: updatedGame.updated_at,
        ball: updatedGame.ball_id ? {
          id: updatedGame.ball_id,
          name: updatedGame.ball_name,
          brand: updatedGame.ball_brand,
          weight: updatedGame.ball_weight
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/games/:id
 * Delete a game and all its frames
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Verify game exists and belongs to user
    const game = global.db.prepare(`
      SELECT id, user_id FROM games WHERE id = ? AND user_id = ?
    `).get(gameId, userId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    // Delete game and all associated frames (cascade)
    const deleteTransaction = global.db.transaction(() => {
      // Delete frames first
      global.db.prepare(`
        DELETE FROM frames WHERE game_id = ?
      `).run(gameId);

      // Delete the game
      global.db.prepare(`
        DELETE FROM games WHERE id = ? AND user_id = ?
      `).run(gameId, userId);
    });

    deleteTransaction();

    res.json({
      message: 'Game deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;