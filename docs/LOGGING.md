# Bowling App Logging System

This document describes the comprehensive logging system implemented for the Bowling App to help with debugging and monitoring.

## Overview

The logging system provides:
- **Structured JSON logging** for easy parsing and analysis
- **Correlation IDs** to track requests across frontend and backend
- **Multiple log levels** (error, warn, info, http, debug)
- **Request/response logging** with timing information
- **Security event tracking** (login attempts, token refresh, etc.)
- **Real-time log monitoring** tools

## Backend Logging

### Winston Logger Configuration

The backend uses Winston for structured logging with the following features:

**Log Levels:**
- `error`: Application errors and exceptions
- `warn`: Warnings and potential issues  
- `info`: General application info
- `http`: HTTP request/response logging
- `debug`: Detailed debugging information

**Log Files:**
- `logs/backend/combined.log`: All log levels
- `logs/backend/error.log`: Error level only
- `logs/backend/access.log`: HTTP requests only
- `logs/backend/exceptions.log`: Uncaught exceptions
- `logs/backend/rejections.log`: Unhandled promise rejections

### Custom Logging Methods

```javascript
const logger = require('./utils/logger');

// HTTP request logging
logger.logRequest(req, res, responseTime);

// Authentication events
logger.logAuth('LOGIN_SUCCESS', userId, { ip, userAgent });

// Security events
logger.logSecurity('FAILED_LOGIN', { identifier, ip });

// Database operations
logger.logDatabase('SELECT', 'users', { query, params });

// General error logging
logger.logError(error, { context, correlationId });
```

### Request Correlation IDs

Every request gets a unique correlation ID that flows through:
- HTTP headers (`X-Correlation-ID`)
- Log entries
- Error responses
- Database operations

## Frontend Logging

### Enhanced API Client

The frontend API client provides:
- Automatic correlation ID generation
- Request/response logging
- Error tracking with context
- Token refresh monitoring

### Auth Store Logging

The authentication store logs:
- Login/logout events
- Token refresh operations
- Session validation
- Authentication errors

## Nginx Logging

### Access Logs

Nginx is configured with structured JSON logging:

```json
{
  "timestamp": "2025-10-07T10:30:45+00:00",
  "remote_addr": "192.168.1.100",
  "request": "GET /api/games HTTP/1.1",
  "status": 200,
  "request_time": "0.045",
  "upstream_response_time": "0.041",
  "request_id": "abc123",
  "user_agent": "Mozilla/5.0..."
}
```

### Log Files

- `logs/frontend/access.log`: All HTTP requests
- `logs/frontend/error.log`: Nginx errors
- `logs/frontend/api_access.log`: API proxy requests only

## Log Monitoring Tools

### Real-time Log Monitoring

**Node.js (Linux/Mac):**
```bash
node scripts/log-monitor.js watch
```

**PowerShell (Windows):**
```powershell
.\scripts\log-monitor.ps1 watch
```

Features:
- Color-coded output by log level
- Real-time tailing of all log files
- Correlation ID and user tracking
- Status code highlighting

### Log Analysis

**Analyze last 60 minutes:**
```bash
node scripts/log-monitor.js analyze
```

**Analyze last 30 minutes:**
```bash
node scripts/log-monitor.js analyze 30
```

**PowerShell:**
```powershell
.\scripts\log-monitor.ps1 analyze -Minutes 30
```

Analysis includes:
- Request counts and response times
- Error and warning summaries
- Unique user and session counts
- Status code distribution
- Authentication event counts

## Debugging Common Issues

### 403 Authentication Errors

1. **Check correlation ID** in error response
2. **Search logs** for that correlation ID:
   ```bash
   grep "abc123" logs/backend/combined.log
   ```
3. **Look for**:
   - Token expiration messages
   - Failed token refresh attempts
   - User status changes

### Network Connectivity Issues

1. **Check frontend logs** for API proxy errors
2. **Check backend logs** for connection issues
3. **Monitor response times** for slow requests

### Performance Issues

1. **Use log analysis** to find slow requests
2. **Check database operations** in debug logs
3. **Monitor memory usage** in application logs

## Log Retention

**Docker Configuration:**
- Max file size: 10MB per container
- Max files: 3 rotated files
- Total retention: ~30MB per service

**Winston File Rotation:**
- Max file size: 5MB
- Max files: 5-10 depending on log type
- Automatic compression of old files

## Security Logging

The system logs security-relevant events:

**Authentication Events:**
- Login attempts (success/failure)
- Token refresh operations
- Logout events
- Invalid token usage

**Access Control:**
- Permission denied events
- Admin access attempts
- Resource access patterns

**Example Security Log:**
```json
{
  "timestamp": "2025-10-07T10:30:45.123Z",
  "level": "warn",
  "message": "Security Event",
  "event": "FAILED_LOGIN",
  "identifier": "user@example.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "abc123"
}
```

## Environment Variables

Configure logging behavior with environment variables:

```env
# Log level (error, warn, info, http, debug)
LOG_LEVEL=info

# Node environment (affects log format)
NODE_ENV=production

# Database path for correlation
DB_PATH=/app/data/bowling.db
```

## Troubleshooting

### Log Files Not Created

1. Check directory permissions for `logs/` folder
2. Ensure Docker volume mounts are correct
3. Verify Winston configuration in `backend/src/utils/logger.js`

### Missing Correlation IDs

1. Check request interceptor in `frontend/src/lib/api.js`
2. Verify middleware order in `backend/src/app.js`
3. Ensure nginx proxy headers are set correctly

### Performance Impact

The logging system is designed for minimal performance impact:
- Asynchronous file writes
- Structured data for efficient parsing
- Configurable log levels
- Automatic file rotation

Monitor application performance and adjust `LOG_LEVEL` if needed.

## Best Practices

1. **Use correlation IDs** to trace requests across services
2. **Include relevant context** in log messages
3. **Use appropriate log levels** (don't log debug in production)
4. **Monitor log file sizes** and rotation
5. **Regularly analyze logs** for patterns and issues
6. **Set up alerts** for error rate increases
7. **Protect sensitive data** (passwords, tokens) from logs

## Integration with External Tools

The structured JSON format allows easy integration with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk** for enterprise log analysis
- **Grafana** for log visualization
- **New Relic** or **DataDog** for APM
- **Custom monitoring** scripts and alerts