
/**
 * Document Upload Handler
 * Handles document (file) messages that are images
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
 * Handle incoming document (photo as file)
 */
export async function handleDocument(ctx: BotContext): Promise<void> {
  const doc = ctx.message?.document;

  if (!doc) {
    return;
  }

  // Check if it's an image
  const mimeType = doc.mime_type ?? '';
  if (!mimeType.startsWith('image/')) {
    await ctx.reply(
      formatError(
        'File Tidak Valid',
        'Hanya file gambar yang didukung.',
        ['Gunakan format JPG, JPEG, atau PNG']
      )
    );
    return;
  }

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
  const fileId = doc.file_id;

  // Get session info
  const session = await sessionService.getSessionById(sessionDbId);
  if (!session) {
    await ctx.reply(formatError('Error', 'Session tidak ditemukan.'));
    return;
  }

  // Use original filename or generate one
  const fileName = doc.file_name ?? `document${Date.now()}.jpg`;

  // Send initial progress message
  const progressMsg = await ctx.reply(
    formatUploadProgress(fileName, sessionId, 0, 'Memulai upload...')
  );

  try {
    // Process upload
    const result = await processUpload(
      ctx.api,
      sessionDbId,
      session.b2FolderPath ?? session.sessionId,
      fileId,
      fileName,
      ctx.from?.id ?? 0,
      async (progress: UploadProgress) => {
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
          // Ignore edit errors
        }
      }
    );

    if (result.success) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        `✅ Upload Complete\n` +
        `📸 ${result.fileName} | 💾 ${formatFileSize((result.fileSizeMB ?? 0) * 1024 * 1024)}`
      );
    } else {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        formatError('Upload Failed', result.error ?? 'Unknown error', [
          'Coba kirim ulang foto',
        ])
      );
    }
  } catch (error) {
    logger.error('Error in handleDocument', 'UPLOAD_HANDLER', error);
    await ctx.api.editMessageText(
      ctx.chat!.id,
      progressMsg.message_id,
      formatError('Upload Failed', 'Terjadi kesalahan sistem.')
    );
  }
}
