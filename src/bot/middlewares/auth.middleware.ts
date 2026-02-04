/**
 * Authentication Middleware
 * Role detection (ADMIN vs USER) based on Telegram User ID
 */

import type { NextFunction } from 'grammy';
import type { BotContext } from '../bot.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Rate limit tracking per user
 */
const rateLimitMap = new Map<
  number,
  {
    uploadCount: number;
    resetTime: number;
  }
>();

const RATE_LIMIT_UPLOADS = 50; // 50 uploads per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

/**
 * Authentication middleware
 * Detects user role (ADMIN or USER) and attaches to session
 */
export async function authMiddleware(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  const userId = ctx.from?.id;

  if (!userId) {
    logger.warn('No user ID found in context', 'AUTH');
    await next();
    return;
  }

  // Check if already authenticated this session
  if (ctx.session.role) {
    await next();
    return;
  }

  try {
    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { telegramUserId: BigInt(userId) },
    });

    if (admin) {
      ctx.session.role = 'ADMIN';
      logger.debug(`User ${userId} authenticated as ADMIN`, 'AUTH');
    } else {
      ctx.session.role = 'USER';
      logger.debug(`User ${userId} authenticated as USER`, 'AUTH');
    }
  } catch (error) {
    logger.error('Error checking admin status', 'AUTH', error);
    ctx.session.role = 'USER'; // Default to USER on error
  }

  await next();
}

/**
 * Check if the current user is an admin
 */
export function isAdmin(ctx: BotContext): boolean {
  return ctx.session.role === 'ADMIN';
}

/**
 * Require admin role middleware
 * Returns error message if user is not admin
 */
export async function requireAdmin(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply(
      '❌ Access Denied\n\n' +
        'Fitur ini hanya tersedia untuk ADMIN.\n' +
        'Hubungi administrator untuk akses.'
    );
    return;
  }

  await next();
}

/**
 * Rate limiting middleware for uploads
 */
export async function rateLimitMiddleware(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  const userId = ctx.from?.id;

  if (!userId) {
    await next();
    return;
  }

  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (userLimit) {
    // Check if window has expired
    if (now > userLimit.resetTime) {
      // Reset counter
      rateLimitMap.set(userId, {
        uploadCount: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
    } else if (userLimit.uploadCount >= RATE_LIMIT_UPLOADS) {
      // Rate limited
      const remainingMinutes = Math.ceil(
        (userLimit.resetTime - now) / (60 * 1000)
      );
      await ctx.reply(
        `⚠️ Rate Limit Exceeded\n\n` +
          `Anda telah mencapai batas upload (${RATE_LIMIT_UPLOADS}/jam).\n` +
          `Silakan tunggu ${remainingMinutes} menit.`
      );
      return;
    } else {
      // Increment counter
      userLimit.uploadCount++;
    }
  } else {
    // Initialize counter
    rateLimitMap.set(userId, {
      uploadCount: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
  }

  await next();
}

/**
 * Get admin by Telegram user ID
 */
export async function getAdminByUserId(
  telegramUserId: number
): Promise<{ id: string; masterKey: string } | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { telegramUserId: BigInt(telegramUserId) },
      select: { id: true, masterKey: true },
    });
    return admin;
  } catch (error) {
    logger.error('Error fetching admin', 'AUTH', error);
    return null;
  }
}

/**
 * Create admin (for seeding)
 */
export async function createAdmin(
  telegramUserId: number,
  username: string | undefined,
  encryptedMasterKey: string
): Promise<void> {
  try {
    await prisma.admin.upsert({
      where: { telegramUserId: BigInt(telegramUserId) },
      update: {
        username,
        masterKey: encryptedMasterKey,
      },
      create: {
        telegramUserId: BigInt(telegramUserId),
        username,
        masterKey: encryptedMasterKey,
      },
    });
    logger.info(`Admin created/updated: ${telegramUserId}`, 'AUTH');
  } catch (error) {
    logger.error('Error creating admin', 'AUTH', error);
    throw error;
  }
}
