/**
 * Logger Utility
 * Simple logging utility with levels and formatted output
 */

import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format log message for console output
 */
function formatLogMessage(log: LogMessage): string {
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };

  let output = `${emoji[log.level]} [${log.timestamp}] [${log.level.toUpperCase()}]`;

  if (log.context) {
    output += ` [${log.context}]`;
  }

  output += ` ${log.message}`;

  if (log.data !== undefined) {
    output += `\n   Data: ${JSON.stringify(log.data, null, 2)}`;
  }

  return output;
}

/**
 * Log to console based on level
 */
function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  // Skip debug logs in production
  if (level === 'debug' && env.NODE_ENV === 'production') {
    return;
  }

  const logMessage: LogMessage = {
    level,
    message,
    timestamp: getTimestamp(),
    context,
    data,
  };

  const formattedMessage = formatLogMessage(logMessage);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
}

/**
 * Logger object with methods for each log level
 */
export const logger = {
  /**
   * Debug level log - only shown in development
   */
  debug: (message: string, context?: string, data?: unknown) =>
    log('debug', message, context, data),

  /**
   * Info level log
   */
  info: (message: string, context?: string, data?: unknown) =>
    log('info', message, context, data),

  /**
   * Warning level log
   */
  warn: (message: string, context?: string, data?: unknown) =>
    log('warn', message, context, data),

  /**
   * Error level log
   */
  error: (message: string, context?: string, data?: unknown) =>
    log('error', message, context, data),

  /**
   * Log bot-related activity
   */
  bot: (message: string, data?: unknown) => log('info', message, 'BOT', data),

  /**
   * Log database-related activity
   */
  db: (message: string, data?: unknown) => log('info', message, 'DATABASE', data),

  /**
   * Log upload-related activity
   */
  upload: (message: string, data?: unknown) => log('info', message, 'UPLOAD', data),

  /**
   * Log B2 storage-related activity
   */
  b2: (message: string, data?: unknown) => log('info', message, 'B2', data),
};
