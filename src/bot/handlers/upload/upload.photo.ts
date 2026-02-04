
/**
 * Photo Upload Handler
 * Handles standard photo messages
 */

import type { BotContext } from '../../bot.js';
import { hasActiveSession } from '../../middlewares/session.middleware.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import { processUpload, type UploadProgress } from '../../../services/upload.service.js';
import { sessionService } from '../../../services/session.service.js';
import {
  formatError,
  formatUploadProgress,
  formatFileSize,
} from '../../../utils/formatters.js';
import { logger } from '../../../utils/logger.js';

/**
 * Handle incoming photo
 */
export async function handlePhoto(ctx: BotContext): Promise<void> {
  // Check if user has active session
  if (!hasActiveSession(ctx)) {
    await ctx.reply(
      formatError(
        'No Active Session',
        'Anda belum memilih session.',
        ['Gunakan /start untuk memilih session']
      ),
      { reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    return;
  }

  const sessionDbId = ctx.session.activeSessionDbId!;
  const sessionId = ctx.session.activeSessionId!;

  // Get highest resolution photo
  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) {
    await ctx.reply('❌ No photo found in message.');
    return;
  }

  // Get the largest photo (last in array)
  const photo = photos[photos.length - 1];
  if (!photo) {
    await ctx.reply('❌ No photo found in message.');
    return;
  }
  const fileId = photo.file_id;

  // Get session info
  const session = await sessionService.getSessionById(sessionDbId);
  if (!session) {
    await ctx.reply(formatError('Error', 'Session tidak ditemukan.'));
    return;
  }

  // Generate filename
  const timestamp = Date.now();
  const fileName = `photo_${timestamp}.jpg`;

  // Send initial progress message
  const progressMsg = await ctx.reply(
    formatUploadProgress(fileName, sessionId, 0, 'Memulai upload...')
  );

  try {
    // Process upload with progress updates
    const result = await processUpload(
      ctx.api,
      sessionDbId,
      session.b2FolderPath ?? session.sessionId,
      fileId,
      fileName,
      ctx.from?.id ?? 0,
      async (progress: UploadProgress) => {
        // Update progress message (throttled)
        try {
          await ctx.api.editMessageText(
            ctx.chat!.id,
            progressMsg.message_id,
            formatUploadProgress(
              fileName,
              sessionId,
              progress.progress,
              progress.message
            )
          );
        } catch {
          // Ignore edit errors (rate limiting, message unchanged)
        }
      }
    );

    if (result.success) {
      // Success message
      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        `✅ Upload Complete\n` +
        `📸 ${result.fileName} | 💾 ${formatFileSize((result.fileSizeMB ?? 0) * 1024 * 1024)}`
      );
    } else {
      // Error message
      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        formatError('Upload Failed', result.error ?? 'Unknown error', [
          'Coba kirim ulang foto',
          'Gunakan /status untuk melihat status',
        ])
      );
    }
  } catch (error) {
    logger.error('Error in handlePhoto', 'UPLOAD_HANDLER', error);
    await ctx.api.editMessageText(
      ctx.chat!.id,
      progressMsg.message_id,
      formatError('Upload Failed', 'Terjadi kesalahan sistem.', [
        'Coba kirim ulang foto',
      ])
    );
  }
}
