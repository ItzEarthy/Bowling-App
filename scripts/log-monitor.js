#!/usr/bin/env node

/**
 * Log monitoring and analysis tool for Bowling App
 * Provides real-time log viewing and basic analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class LogMonitor {
  constructor() {
    this.logPaths = {
      backend: {
        combined: './logs/backend/combined.log',
        error: './logs/backend/error.log',
        access: './logs/backend/access.log'
      },
      frontend: {
        access: './logs/frontend/access.log',
        error: './logs/frontend/error.log',
        api: './logs/frontend/api_access.log'
      }
    };
  }

  colorize(level, message) {
    switch (level) {
      case 'error':
        return `${COLORS.red}${message}${COLORS.reset}`;
      case 'warn':
        return `${COLORS.yellow}${message}${COLORS.reset}`;
      case 'info':
        return `${COLORS.green}${message}${COLORS.reset}`;
      case 'http':
        return `${COLORS.magenta}${message}${COLORS.reset}`;
      case 'debug':
        return `${COLORS.cyan}${message}${COLORS.reset}`;
      default:
        return message;
    }
  }

  formatLogEntry(rawLine, source) {
    try {
      const logEntry = JSON.parse(rawLine);
      const timestamp = new Date(logEntry.timestamp).toLocaleString();
      const level = logEntry.level || 'info';
      const message = logEntry.message || rawLine;
      
      let formatted = `[${timestamp}] [${source.toUpperCase()}] `;
      formatted += this.colorize(level, `${level.toUpperCase()}: ${message}`);
      
      if (logEntry.correlationId) {
        formatted += ` ${COLORS.blue}[CID: ${logEntry.correlationId}]${COLORS.reset}`;
      }
      
      if (logEntry.userId) {
        formatted += ` ${COLORS.yellow}[User: ${logEntry.userId}]${COLORS.reset}`;
      }
      
      if (logEntry.statusCode) {
        const statusColor = logEntry.statusCode >= 400 ? COLORS.red : 
                           logEntry.statusCode >= 300 ? COLORS.yellow : COLORS.green;
        formatted += ` ${statusColor}[${logEntry.statusCode}]${COLORS.reset}`;
      }
      
      return formatted;
    } catch (error) {
      // Not JSON, return as-is with source prefix
      const timestamp = new Date().toLocaleString();
      return `[${timestamp}] [${source.toUpperCase()}] ${rawLine}`;
    }
  }

  tailLog(filePath, source) {
    if (!fs.existsSync(filePath)) {
      console.log(`${COLORS.yellow}Warning: Log file ${filePath} does not exist${COLORS.reset}`);
      return null;
    }

    const tail = spawn('tail', ['-f', filePath]);
    
    tail.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(this.formatLogEntry(line, source));
      });
    });

    tail.stderr.on('data', (data) => {
      console.error(`${COLORS.red}Tail error for ${source}: ${data}${COLORS.reset}`);
    });

    return tail;
  }

  async watchAllLogs() {
    console.log(`${COLORS.bright}${COLORS.green}🎳 Bowling App Log Monitor${COLORS.reset}`);
    console.log(`${COLORS.cyan}Starting log monitoring...${COLORS.reset}\n`);

    const processes = [];

    // Monitor backend logs
    Object.entries(this.logPaths.backend).forEach(([type, path]) => {
      const process = this.tailLog(path, `backend-${type}`);
      if (process) processes.push(process);
    });

    // Monitor frontend logs
    Object.entries(this.logPaths.frontend).forEach(([type, path]) => {
      const process = this.tailLog(path, `frontend-${type}`);
      if (process) processes.push(process);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n${COLORS.yellow}Stopping log monitoring...${COLORS.reset}`);
      processes.forEach(proc => proc.kill());
      process.exit(0);
    });

    // Keep the process alive
    process.stdin.resume();
  }

  async analyzeLogs(minutes = 60) {
    console.log(`${COLORS.bright}${COLORS.blue}📊 Log Analysis (Last ${minutes} minutes)${COLORS.reset}\n`);

    const since = new Date(Date.now() - minutes * 60 * 1000);
    const analysis = {
      errors: 0,
      warnings: 0,
      requests: 0,
      slowRequests: 0,
      authEvents: 0,
      correlationIds: new Set(),
      users: new Set(),
      statusCodes: {}
    };

    // Analyze backend logs
    const backendCombined = this.logPaths.backend.combined;
    if (fs.existsSync(backendCombined)) {
      const content = fs.readFileSync(backendCombined, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line);
          const logTime = new Date(logEntry.timestamp);
          
          if (logTime >= since) {
            if (logEntry.level === 'error') analysis.errors++;
            if (logEntry.level === 'warn') analysis.warnings++;
            if (logEntry.level === 'http') analysis.requests++;
            if (logEntry.correlationId) analysis.correlationIds.add(logEntry.correlationId);
            if (logEntry.userId) analysis.users.add(logEntry.userId);
            if (logEntry.statusCode) {
              analysis.statusCodes[logEntry.statusCode] = (analysis.statusCodes[logEntry.statusCode] || 0) + 1;
            }
            if (logEntry.responseTime && logEntry.responseTime > 1000) {
              analysis.slowRequests++;
            }
            if (logEntry.action && ['LOGIN_SUCCESS', 'LOGOUT', 'TOKEN_REFRESH'].includes(logEntry.action)) {
              analysis.authEvents++;
            }
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      });
    }

    // Display analysis
    console.log(`${COLORS.green}📈 Summary:${COLORS.reset}`);
    console.log(`  Total Requests: ${analysis.requests}`);
    console.log(`  Unique Users: ${analysis.users.size}`);
    console.log(`  Unique Sessions: ${analysis.correlationIds.size}`);
    console.log(`  Auth Events: ${analysis.authEvents}`);
    
    if (analysis.errors > 0) {
      console.log(`  ${COLORS.red}Errors: ${analysis.errors}${COLORS.reset}`);
    } else {
      console.log(`  ${COLORS.green}Errors: 0${COLORS.reset}`);
    }
    
    if (analysis.warnings > 0) {
      console.log(`  ${COLORS.yellow}Warnings: ${analysis.warnings}${COLORS.reset}`);
    } else {
      console.log(`  ${COLORS.green}Warnings: 0${COLORS.reset}`);
    }
    
    if (analysis.slowRequests > 0) {
      console.log(`  ${COLORS.yellow}Slow Requests (>1s): ${analysis.slowRequests}${COLORS.reset}`);
    }

    if (Object.keys(analysis.statusCodes).length > 0) {
      console.log(`\n${COLORS.blue}📊 Status Codes:${COLORS.reset}`);
      Object.entries(analysis.statusCodes).forEach(([code, count]) => {
        const color = code >= 400 ? COLORS.red : code >= 300 ? COLORS.yellow : COLORS.green;
        console.log(`  ${color}${code}: ${count}${COLORS.reset}`);
      });
    }
  }

  showHelp() {
    console.log(`${COLORS.bright}🎳 Bowling App Log Monitor${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node scripts/log-monitor.js [command] [options]

${COLORS.cyan}Commands:${COLORS.reset}
  watch                 Watch all logs in real-time (default)
  analyze [minutes]     Analyze logs from the last N minutes (default: 60)
  help                  Show this help message

${COLORS.cyan}Examples:${COLORS.reset}
  node scripts/log-monitor.js                    # Watch all logs
  node scripts/log-monitor.js analyze            # Analyze last 60 minutes
  node scripts/log-monitor.js analyze 30         # Analyze last 30 minutes

${COLORS.cyan}Log Files:${COLORS.reset}
  Backend: ./logs/backend/combined.log, error.log, access.log
  Frontend: ./logs/frontend/access.log, error.log, api_access.log
`);
  }
}

// Main execution
const monitor = new LogMonitor();
const command = process.argv[2] || 'watch';
const arg = process.argv[3];

switch (command) {
  case 'watch':
    monitor.watchAllLogs();
    break;
  case 'analyze':
    const minutes = parseInt(arg) || 60;
    monitor.analyzeLogs(minutes);
    break;
  case 'help':
  case '--help':
  case '-h':
    monitor.showHelp();
    break;
  default:
    console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
    monitor.showHelp();
    process.exit(1);
}