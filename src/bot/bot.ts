/**
 * Bot Configuration
 * grammy bot instance and configuration
 */

import { Bot, session, GrammyError, HttpError } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { errorBoundary } from './middlewares/error.middleware.js';

// ============================================
// Session Data Interface
// ============================================

/**
 * User session data stored in memory
 */
export interface SessionData {
  // Current active session
  activeSessionId?: string;
  activeSessionDbId?: string;

  // Conversation state for multi-step flows
  conversationState?:
    | 'awaiting_session_id'
    | 'awaiting_access_key'
    | 'awaiting_prefix'
    | 'awaiting_description'
    | 'awaiting_confirmation'
    | 'batch_mode'
    | 'batch_collecting'
    | 'batch_description';

  // Temporary data for multi-step flows
  tempData?: {
    prefix?: string;
    sessionIdPreview?: string;
    accessKey?: string;
    description?: string;
    sessionId?: string;
    sessionDbId?: string;
    batchPhotos?: Array<{
      fileId: string;
      fileName: string;
      isDocument: boolean;
    }>;
  };

  // User info
  role?: 'ADMIN' | 'USER';

  // Upload tracking
  uploadStartTime?: number;
}

/**
 * Custom context type with session
 */
export type BotContext = Context & SessionFlavor<SessionData>;

// ============================================
// Bot Instance Creation
// ============================================

/**
 * Create and configure the bot instance
 */
export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

  // Configure session middleware
  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );


  // Error handling
  bot.catch(errorBoundary);

  logger.bot('Bot instance created');

  return bot;
}

/**
 * Check if user is admin
 */
export function isAdmin(ctx: BotContext): boolean {
  return ctx.session.role === 'ADMIN';
}

/**
 * Check if user has active session
 */
export function hasActiveSession(ctx: BotContext): boolean {
  return ctx.session.activeSessionId !== undefined;
}

/**
 * Get current conversation state
 */
export function getConversationState(ctx: BotContext): SessionData['conversationState'] {
  return ctx.session.conversationState;
}

/**
 * Set conversation state
 */
export function setConversationState(
  ctx: BotContext,
  state: SessionData['conversationState']
): void {
  ctx.session.conversationState = state;
}

/**
 * Clear conversation state
 */
export function clearConversationState(ctx: BotContext): void {
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;
}

/**
 * Clear session data
 */
export function clearSession(ctx: BotContext): void {
  ctx.session.activeSessionId = undefined;
  ctx.session.activeSessionDbId = undefined;
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;
  ctx.session.uploadStartTime = undefined;
}

export { Bot };
