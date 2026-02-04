/**
 * Error Middleware
 * Global error handling for the bot
 */

import { GrammyError, HttpError } from 'grammy';
import { BotContext } from '../bot.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../config/database.js';

/**
 * Global error handler for the bot
 */
export async function errorBoundary(err: any) {
  const ctx = err.ctx as BotContext;
  const e = err.error;

  const updateId = ctx.update.update_id;
  const userId = ctx.from?.id;
  const message = e instanceof Error ? e.message : String(e);
  const stack = e instanceof Error ? e.stack : undefined;

  // Log to console via logger
  logger.error(`Error in update ${updateId}:`, 'BOT', {
    userId,
    message,
  });

  if (e instanceof GrammyError) {
    logger.error(`GrammY request failed: ${e.description}`, 'GRAMMY', {
      method: e.method,
      payload: e.payload,
    });
  } else if (e instanceof HttpError) {
    logger.error(`Could not contact Telegram: ${e.message}`, 'HTTP');
  }

  // Log to database
  try {
    await prisma.errorLog.create({
      data: {
        level: 'ERROR',
        context: 'BOT',
        message: message,
        stack: stack,
        userId: userId ? BigInt(userId) : null,
        updateId: updateId,
        data: e instanceof GrammyError ? (e.payload as any) : undefined,
      },
    });
  } catch (dbError) {
    logger.error('Failed to log error to database', 'DB', dbError);
  }

  // Notify user
  try {
    const errorText = '❌ Terjadi kesalahan pada sistem. Silakan coba lagi nanti atau hubungi admin jika masalah berlanjut.';
    
    // Check if it's a callback query to answer it
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: '❌ Terjadi kesalahan sistem.',
        show_alert: true,
      }).catch(() => {});
    }

    await ctx.reply(errorText).catch(() => {});
  } catch (replyError) {
    logger.error('Failed to send error notification to user', 'BOT', replyError);
  }
}
