
/**
 * Batch Mode Commands
 * Handles /batch and cancellation
 */

import type { BotContext } from '../../bot.js';
import { hasActiveSession } from '../../middlewares/session.middleware.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import { formatError } from '../../../utils/formatters.js';

/**
 * Handle /batch command - Start batch mode
 */
export async function handleBatchCommand(ctx: BotContext): Promise<void> {
  // Check if user has active session
  if (!hasActiveSession(ctx)) {
    await ctx.reply(
      formatError(
        'No Active Session',
        'Anda belum memilih session.',
        ['Gunakan /start untuk memilih session terlebih dahulu']
      ),
      { reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    return;
  }

  // Check if already in batch mode
  if (ctx.session.conversationState === 'batch_collecting') {
    const batchCount = ctx.session.tempData?.batchPhotos?.length ?? 0;
    await ctx.reply(
      `📦 Anda sudah dalam mode batch.\n\n` +
        `📸 Photos collected: ${batchCount}\n\n` +
        `Kirim foto lagi atau gunakan /endbatch untuk memproses.`
    );
    return;
  }

  // Initialize batch mode
  ctx.session.conversationState = 'batch_collecting';
  ctx.session.tempData = {
    ...ctx.session.tempData,
    batchPhotos: [],
  };

  const sessionId = ctx.session.activeSessionId!;

  await ctx.reply(
    `📦 Batch Mode Activated\n\n` +
      `📁 Session: \`${sessionId}\`\n\n` +
      `Anda sekarang bisa mengirim banyak foto sekaligus.\n` +
      `Semua foto akan diupload dengan satu deskripsi.\n\n` +
      `📤 Kirim foto-foto Anda sekarang...\n` +
      `✅ Gunakan /endbatch ketika selesai`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Cancel batch mode
 */
export async function cancelBatch(ctx: BotContext): Promise<void> {
  if (
    ctx.session.conversationState !== 'batch_collecting' &&
    ctx.session.conversationState !== 'batch_description'
  ) {
    return;
  }

  const count = ctx.session.tempData?.batchPhotos?.length ?? 0;

  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;

  await ctx.reply(
    `❌ Batch mode cancelled.\n\n` +
      `${count} photo(s) discarded.`
  );
}
