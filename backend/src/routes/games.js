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
router.post('/', authenticateToken, validateRequest(createGameSchema), (req, res, next) => {
  try {
    const { ball_id, location } = req.body;
    const userId = req.user.userId;

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
      INSERT INTO games (user_id, ball_id, location)
      VALUES (?, ?, ?)
    `);

    const result = insertGame.run(userId, ball_id || null, location || null);
    const gameId = result.lastInsertRowid;

    // Create empty frames for the game
    const insertFrame = global.db.prepare(`
      INSERT INTO frames (game_id, frame_number, throws_data)
      VALUES (?, ?, ?)
    `);

    for (let i = 1; i <= 10; i++) {
      insertFrame.run(gameId, i, JSON.stringify([]));
    }

    // Get the complete game data
    const game = global.db.prepare(`
      SELECT g.*, b.name as ball_name, b.brand as ball_brand, b.weight as ball_weight
      FROM games g
      LEFT JOIN balls b ON g.ball_id = b.id
      WHERE g.id = ?
    `).get(gameId);

    const frames = global.db.prepare(`
      SELECT * FROM frames WHERE game_id = ? ORDER BY frame_number
    `).all(gameId);

    res.status(201).json({
      message: 'Game created successfully',
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
      UPDATE games SET score = ?, is_complete = ? WHERE id = ?
    `).run(finalScore, gameComplete ? 1 : 0, gameId);

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

module.exports = router;