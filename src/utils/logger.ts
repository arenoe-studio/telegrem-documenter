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
async function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
  saveToDb: boolean = false
): Promise<void> {
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

  if (saveToDb && (level === 'error' || level === 'warn')) {
    try {
      const { prisma } = await import('../config/database.js');
      await prisma.errorLog.create({
        data: {
          level: level.toUpperCase(),
          context,
          message,
          data: data ? (data as any) : undefined,
        },
      });
    } catch (dbError) {
      console.error('❌ [CRITICAL] Failed to save log to database:', dbError);
    }
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
    void log('debug', message, context, data),

  /**
   * Info level log
   */
  info: (message: string, context?: string, data?: unknown) =>
    void log('info', message, context, data),

  /**
   * Warning level log
   */
  warn: (message: string, context?: string, data?: unknown, saveToDb: boolean = false) =>
    void log('warn', message, context, data, saveToDb),

  /**
   * Error level log
   */
  error: (message: string, context?: string, data?: unknown, saveToDb: boolean = false) =>
    void log('error', message, context, data, saveToDb),

  /**
   * Log bot-related activity
   */
  bot: (message: string, data?: unknown) => void log('info', message, 'BOT', data),

  /**
   * Log database-related activity
   */
  db: (message: string, data?: unknown) => void log('info', message, 'DATABASE', data),

  /**
   * Log upload-related activity
   */
  upload: (message: string, data?: unknown) => void log('info', message, 'UPLOAD', data),

  /**
   * Log B2 storage-related activity
   */
  b2: (message: string, data?: unknown) => void log('info', message, 'B2', data),
};
