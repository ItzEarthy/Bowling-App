const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request logging middleware with correlation IDs
 * Tracks HTTP requests and responses with unique identifiers
 */

// Add correlation ID to each request
const addCorrelationId = (req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || uuidv4();
  res.set('X-Correlation-ID', req.correlationId);
  next();
};

// Custom morgan tokens
morgan.token('correlation-id', (req) => req.correlationId);
morgan.token('user-id', (req) => req.user?.userId || 'anonymous');
morgan.token('real-ip', (req) => {
  return req.get('X-Real-IP') || 
         req.get('X-Forwarded-For')?.split(',')[0] || 
         req.connection.remoteAddress;
});

// Custom morgan format for structured logging
const morganFormat = process.env.NODE_ENV === 'production' 
  ? JSON.stringify({
      timestamp: ':date[iso]',
      method: ':method',
      url: ':url',
      status: ':status',
      responseTime: ':response-time ms',
      contentLength: ':res[content-length]',
      userAgent: ':user-agent',
      ip: ':real-ip',
      correlationId: ':correlation-id',
      userId: ':user-id',
      referrer: ':referrer'
    })
  : ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms [CID: :correlation-id]';

// Create morgan middleware
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      // Parse JSON format for production, use as-is for development
      if (process.env.NODE_ENV === 'production') {
        try {
          const logData = JSON.parse(message.trim());
          logger.log('http', 'HTTP Request', logData);
        } catch (err) {
          logger.log('http', message.trim());
        }
      } else {
        logger.log('http', message.trim());
      }
    }
  },
  skip: (req, res) => {
    // Skip logging for health checks and static assets in production
    if (process.env.NODE_ENV === 'production') {
      return req.url.includes('/health') || 
             req.url.includes('.js') || 
             req.url.includes('.css') || 
             req.url.includes('.ico');
    }
    return false;
  }
});

// Enhanced error logging middleware
const errorLogger = (err, req, res, next) => {
  const errorId = uuidv4();
  
  // Log the error with context
  logger.logError(err, {
    errorId,
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.userId,
    userAgent: req.get('User-Agent'),
    ip: req.get('X-Real-IP') || req.ip,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    params: req.params,
    query: req.query
  });
  
  // Add error ID to response for tracking
  res.set('X-Error-ID', errorId);
  
  next(err);
};

// Request timing middleware
const requestTimer = (req, res, next) => {
  req.startTime = Date.now();
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - req.startTime;
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        responseTime: responseTime,
        correlationId: req.correlationId,
        userId: req.user?.userId
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Security event logger
const securityLogger = {
  logFailedLogin: (req, identifier) => {
    logger.logSecurity('FAILED_LOGIN', {
      identifier,
      ip: req.get('X-Real-IP') || req.ip,
      userAgent: req.get('User-Agent'),
      correlationId: req.correlationId
    });
  },
  
  logSuccessfulLogin: (req, userId) => {
    logger.logAuth('LOGIN_SUCCESS', userId, {
      ip: req.get('X-Real-IP') || req.ip,
      userAgent: req.get('User-Agent'),
      correlationId: req.correlationId
    });
  },
  
  logLogout: (req, userId) => {
    logger.logAuth('LOGOUT', userId, {
      ip: req.get('X-Real-IP') || req.ip,
      correlationId: req.correlationId
    });
  },
  
  logTokenRefresh: (req, userId) => {
    logger.logAuth('TOKEN_REFRESH', userId, {
      ip: req.get('X-Real-IP') || req.ip,
      correlationId: req.correlationId
    });
  },
  
  logInvalidToken: (req) => {
    logger.logSecurity('INVALID_TOKEN', {
      ip: req.get('X-Real-IP') || req.ip,
      userAgent: req.get('User-Agent'),
      correlationId: req.correlationId,
      url: req.originalUrl
    });
  },
  
  logPermissionDenied: (req, resource) => {
    logger.logSecurity('PERMISSION_DENIED', {
      userId: req.user?.userId,
      resource,
      ip: req.get('X-Real-IP') || req.ip,
      correlationId: req.correlationId
    });
  }
};

module.exports = {
  addCorrelationId,
  requestLogger,
  errorLogger,
  requestTimer,
  securityLogger
};