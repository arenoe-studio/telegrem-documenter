
/**
 * Common Upload Utilities
 * Refresh command and status helpers
 */

import type { BotContext } from '../../bot.js';
import { hasActiveSession } from '../../middlewares/session.middleware.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import {
  getUploadStats,
  getFailedUploads,
  markForRetry,
} from '../../../services/upload.service.js';
import { sessionService } from '../../../services/session.service.js';
import { formatSuccess } from '../../../utils/formatters.js';

/**
 * Handle /refresh command - retry failed uploads
 */
export async function handleRefresh(ctx: BotContext): Promise<void> {
  if (!hasActiveSession(ctx)) {
    await ctx.reply(
      'ℹ️ Tidak ada session aktif.',
      { reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    return;
  }

  const sessionDbId = ctx.session.activeSessionDbId!;
  const sessionId = ctx.session.activeSessionId!;

  // Get failed uploads
  const failedUploads = await getFailedUploads(sessionDbId);

  if (failedUploads.length === 0) {
    await ctx.reply(
      formatSuccess('All Good!', 'Tidak ada upload yang gagal.')
    );
    return;
  }

  // Mark failed uploads for retry
  for (const upload of failedUploads) {
    await markForRetry(upload.id);
  }

  await ctx.reply(
    `🔄 Refresh Complete\n\n` +
      `📁 Session: \`${sessionId}\`\n` +
      `🔄 Marked ${failedUploads.length} uploads for retry.\n\n` +
      `Note: Silakan kirim ulang foto yang gagal.`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Get session status with stats
 */
export async function getSessionStatus(
  sessionDbId: string,
  sessionId: string
): Promise<string> {
  const stats = await getUploadStats(sessionDbId);
  const session = await sessionService.getSessionById(sessionDbId);

  if (!session) {
    return 'Session tidak ditemukan.';
  }

  return (
    `📊 Session Status\n\n` +
    `📁 Session: \`${sessionId}\`\n` +
    `📝 ${session.description}\n\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `📸 Total Photos: ${stats.totalFiles}\n` +
    `✅ Completed: ${stats.successCount}\n` +
    `❌ Failed: ${stats.failedCount}\n` +
    `⏳ Pending: ${stats.pendingCount}\n` +
    `💾 Total Size: ${stats.totalSizeMB.toFixed(1)} MB\n` +
    `━━━━━━━━━━━━━━━━`
  );
}
