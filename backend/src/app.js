const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const ballRoutes = require('./routes/balls');
const friendRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');

/**
 * Express application setup with middleware and routes
 */
const app = express();

// Security middleware
// Configure Content Security Policy with sensible defaults for a PWA.
// Allow additional origins via CORS_ORIGINS if present (used for connect/manifest/worker destinations).
const rawCspExtra = process.env.CSP_EXTRA_ORIGINS || '';
const cspExtra = rawCspExtra.split(',').map(s => s.trim()).filter(Boolean);

const makeSrcList = (base = ["'self'"]) => base.concat(cspExtra);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: makeSrcList(["'self'"]),
      scriptSrc: makeSrcList(["'self'"]),
      styleSrc: makeSrcList(["'self'", "'unsafe-inline'"]),
      imgSrc: makeSrcList(["'self'", 'data:', 'https:']),
      connectSrc: makeSrcList(["'self'", 'https:']),
      manifestSrc: makeSrcList(["'self'"]),
      workerSrc: makeSrcList(["'self'", 'blob:']),
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS configuration
// Allow configuring multiple allowed origins via CORS_ORIGINS (comma-separated) or a single CORS_ORIGIN.
// If not provided, allow same-origin requests by default (useful when frontend is proxied through the same host).
const rawCorsOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';
let allowedOrigins = null;
if (rawCorsOrigins) {
  // Support comma-separated list
  allowedOrigins = rawCorsOrigins.split(',').map(s => s.trim()).filter(Boolean);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server, curl, or same-origin)
    if (!origin) return callback(null, true);

    // If allowedOrigins not configured, allow same-origin only
    if (!allowedOrigins) {
      return callback(null, false);
    }

    // If wildcard present, allow any origin
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Allow if origin matches one of the configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Not allowed
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/balls', ballRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;