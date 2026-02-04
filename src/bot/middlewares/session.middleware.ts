/**
 * Session State Middleware
 * Manages active session state and user context
 */

import type { NextFunction } from 'grammy';
import type { BotContext } from '../bot.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

/**
 * Load user session state from database
 */
export async function loadSessionState(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  const userId = ctx.from?.id;

  if (!userId) {
    await next();
    return;
  }

  try {
    // Load user state from database
    const userState = await prisma.userSessionState.findUnique({
      where: { telegramUserId: BigInt(userId) },
    });

    if (userState) {
      // Check for session timeout
      const lastActivity = userState.lastActivity.getTime();
      const now = Date.now();

      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        // Session timed out, clear it using raw query for JSON null
        await prisma.$executeRaw`
          UPDATE "user_session_states" 
          SET "activeSessionId" = NULL, 
              "conversationState" = NULL, 
              "stateData" = NULL,
              "lastActivity" = NOW()
          WHERE "telegramUserId" = ${BigInt(userId)}
        `;
        logger.debug(`Session timeout for user ${userId}`, 'SESSION_STATE');
      } else {
        // Restore session state
        if (userState.activeSessionId) {
          ctx.session.activeSessionDbId = userState.activeSessionId;
          
          // Get the session ID string
          const session = await prisma.session.findUnique({
            where: { id: userState.activeSessionId },
            select: { sessionId: true },
          });
          if (session) {
            ctx.session.activeSessionId = session.sessionId;
          }
        }

        if (userState.conversationState) {
          ctx.session.conversationState = userState.conversationState as BotContext['session']['conversationState'];
        }

        if (userState.stateData) {
          ctx.session.tempData = userState.stateData as BotContext['session']['tempData'];
        }
      }
    }
  } catch (error) {
    logger.error('Error loading session state', 'SESSION_STATE', error);
  }

  await next();
}

/**
 * Save user session state to database
 */
export async function saveSessionState(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;

  if (!userId) return;

  try {
    // Build update data conditionally
    const hasStateData = ctx.session.tempData !== undefined;
    
    if (hasStateData) {
      // Has state data - use normal upsert
      await prisma.userSessionState.upsert({
        where: { telegramUserId: BigInt(userId) },
        update: {
          activeSessionId: ctx.session.activeSessionDbId ?? null,
          conversationState: ctx.session.conversationState ?? null,
          stateData: ctx.session.tempData as object,
          lastActivity: new Date(),
        },
        create: {
          telegramUserId: BigInt(userId),
          activeSessionId: ctx.session.activeSessionDbId ?? null,
          conversationState: ctx.session.conversationState ?? null,
          stateData: ctx.session.tempData as object,
        },
      });
    } else {
      // No state data - check if record exists first
      const existing = await prisma.userSessionState.findUnique({
        where: { telegramUserId: BigInt(userId) },
      });

      if (existing) {
        // Update without stateData, use raw query to set JSON to null
        await prisma.$executeRaw`
          UPDATE "user_session_states" 
          SET "activeSessionId" = ${ctx.session.activeSessionDbId ?? null}, 
              "conversationState" = ${ctx.session.conversationState ?? null}, 
              "stateData" = NULL,
              "lastActivity" = NOW(),
              "updatedAt" = NOW()
          WHERE "telegramUserId" = ${BigInt(userId)}
        `;
      } else {
        // Create new record with null stateData
        await prisma.$executeRaw`
          INSERT INTO "user_session_states" 
          ("id", "telegramUserId", "activeSessionId", "conversationState", "stateData", "lastActivity", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${BigInt(userId)},
            ${ctx.session.activeSessionDbId ?? null},
            ${ctx.session.conversationState ?? null},
            NULL,
            NOW(),
            NOW(),
            NOW()
          )
        `;
      }
    }
  } catch (error) {
    logger.error('Error saving session state', 'SESSION_STATE', error);
  }
}

/**
 * Clear user session state
 */
export async function clearUserSessionState(
  telegramUserId: number
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "user_session_states" 
      SET "activeSessionId" = NULL, 
          "conversationState" = NULL, 
          "stateData" = NULL,
          "lastActivity" = NOW(),
          "updatedAt" = NOW()
      WHERE "telegramUserId" = ${BigInt(telegramUserId)}
    `;
  } catch (error) {
    logger.error('Error clearing session state', 'SESSION_STATE', error);
  }
}

/**
 * Set active session for user
 */
export async function setActiveSession(
  ctx: BotContext,
  sessionDbId: string,
  sessionId: string
): Promise<void> {
  ctx.session.activeSessionDbId = sessionDbId;
  ctx.session.activeSessionId = sessionId;
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;
  ctx.session.uploadStartTime = Date.now();

  await saveSessionState(ctx);
}

/**
 * Clear active session for user
 */
export async function clearActiveSession(ctx: BotContext): Promise<void> {
  ctx.session.activeSessionDbId = undefined;
  ctx.session.activeSessionId = undefined;
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;
  ctx.session.uploadStartTime = undefined;

  await saveSessionState(ctx);
}

/**
 * Check if user has active session
 */
export function hasActiveSession(ctx: BotContext): boolean {
  return ctx.session.activeSessionDbId !== undefined;
}

/**
 * Set conversation state
 */
export async function setConversationState(
  ctx: BotContext,
  state: BotContext['session']['conversationState'],
  tempData?: BotContext['session']['tempData']
): Promise<void> {
  ctx.session.conversationState = state;
  if (tempData !== undefined) {
    ctx.session.tempData = tempData;
  }
  await saveSessionState(ctx);
}

/**
 * Clear conversation state
 */
export async function clearConversationState(ctx: BotContext): Promise<void> {
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;
  await saveSessionState(ctx);
}

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(userId: number): Promise<void> {
  try {
    await prisma.userSessionState.update({
      where: { telegramUserId: BigInt(userId) },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    // Ignore if user state doesn't exist
  }
}
