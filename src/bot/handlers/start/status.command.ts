
/**
 * Session Status & Lifecycle Commands
 * Handles /status, /end
 */

import type { BotContext } from '../../bot.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import { hasActiveSession, clearActiveSession } from '../../middlewares/session.middleware.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { sessionService } from '../../../services/session.service.js';
import { logger } from '../../../utils/logger.js';

/**
 * Handle /status command
 */
export async function handleStatus(ctx: BotContext): Promise<void> {
  if (!hasActiveSession(ctx)) {
    await ctx.reply(
      `ℹ️ Status\n\n` +
        `Tidak ada session aktif.\n` +
        `Pilih session untuk mulai upload.`,
      { parse_mode: 'Markdown', reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    return;
  }

  const sessionDbId = ctx.session.activeSessionDbId!;
  const sessionId = ctx.session.activeSessionId!;
  const stats = await sessionService.getSessionStats(sessionDbId);
  const session = await sessionService.getSessionById(sessionDbId);

  if (!stats || !session) {
    await ctx.reply('❌ Error loading session stats.');
    return;
  }

  const duration = ctx.session.uploadStartTime
    ? formatDuration(Date.now() - ctx.session.uploadStartTime)
    : '-';

  await ctx.reply(
    `📊 Session Status\n\n` +
      `📁 Session: \`${sessionId}\`\n` +
      `📝 ${session.description}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📸 Total Photos: ${stats.totalFiles}\n` +
      `✅ Completed: ${stats.successCount}\n` +
      `❌ Failed: ${stats.failedCount}\n` +
      `⏳ Pending: ${stats.pendingCount}\n` +
      `💾 Total Size: ${stats.totalSizeMB.toFixed(1)} MB\n` +
      `⏱️ Duration: ${duration}\n` +
      `━━━━━━━━━━━━━━━━`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle /end command
 */
export async function handleEnd(ctx: BotContext): Promise<void> {
  if (!hasActiveSession(ctx)) {
    await ctx.reply(
      `ℹ️ Tidak ada session aktif untuk diakhiri.`,
      { reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    return;
  }

  const sessionDbId = ctx.session.activeSessionDbId!;
  const sessionId = ctx.session.activeSessionId!;
  const stats = await sessionService.getSessionStats(sessionDbId);
  const session = await sessionService.getSessionById(sessionDbId);

  if (!stats || !session) {
    await ctx.reply('❌ Error loading session data.');
    return;
  }

  const duration = ctx.session.uploadStartTime
    ? formatDuration(Date.now() - ctx.session.uploadStartTime)
    : '-';

  // Clear active session
  await clearActiveSession(ctx);

  await ctx.reply(
    `✅ Session Ended\n\n` +
      `📁 Session: \`${sessionId}\`\n` +
      `📝 ${session.description}\n\n` +
      `📊 Final Report:\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📸 Total Photos: ${stats.totalFiles}\n` +
      `✅ Completed: ${stats.successCount}\n` +
      `❌ Failed: ${stats.failedCount}\n` +
      `💾 Total Size: ${stats.totalSizeMB.toFixed(1)} MB\n` +
      `⏱️ Duration: ${duration}\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `Thank you for using Telegram Documenter!`,
    { parse_mode: 'Markdown', reply_markup: getMainMenu(isAdmin(ctx)) }
  );

  logger.info(`Session ${sessionId} ended by user ${ctx.from?.id}`, 'START_HANDLER');
}

/**
 * Format duration from milliseconds
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}d`);

  return parts.join(' ');
}
