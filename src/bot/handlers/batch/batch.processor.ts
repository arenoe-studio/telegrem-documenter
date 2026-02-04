
/**
 * Batch Mode Processor
 * Handles final batch processing and upload
 */

import type { BotContext } from '../../bot.js';
import { sessionService } from '../../../services/session.service.js';
import { processUpload } from '../../../services/upload.service.js';
import {
  formatError,
  formatBatchProgress,
  formatFileSize,
} from '../../../utils/formatters.js';
import { logger } from '../../../utils/logger.js';
import type { BatchPhoto } from './batch.types.js';

/**
 * Handle batch description input and process upload
 */
export async function handleBatchDescription(ctx: BotContext): Promise<boolean> {
  if (ctx.session.conversationState !== 'batch_description') {
    return false;
  }

  const description = ctx.message?.text?.trim();
  if (!description) {
    await ctx.reply('❌ Masukkan deskripsi yang valid.');
    return true;
  }

  // Cast batchPhotos to typed array
  const batchPhotos = (ctx.session.tempData?.batchPhotos ?? []) as BatchPhoto[];
  const sessionDbId = ctx.session.activeSessionDbId!;
  const sessionId = ctx.session.activeSessionId!;

  // Get session info
  const session = await sessionService.getSessionById(sessionDbId);
  if (!session) {
    await ctx.reply(formatError('Error', 'Session tidak ditemukan.'));
    ctx.session.conversationState = undefined;
    ctx.session.tempData = undefined;
    return true;
  }

  // Send initial progress message
  const progressMsg = await ctx.reply(
    formatBatchProgress(0, batchPhotos.length, [], batchPhotos[0]?.fileName)
  );

  const completedFiles: string[] = [];
  const failedFiles: string[] = [];
  let totalSizeMB = 0;

  // Process each photo
  for (let i = 0; i < batchPhotos.length; i++) {
    const photo = batchPhotos[i];
    if (!photo) continue;

    const currentFileName = photo.fileName;
    const pendingFiles = batchPhotos.slice(i + 1).map(p => p.fileName);

    // Update progress
    try {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        progressMsg.message_id,
        formatBatchProgress(
          i,
          batchPhotos.length,
          completedFiles,
          currentFileName,
          pendingFiles.slice(0, 3) // Show max 3 pending
        )
      );
    } catch {
      // Ignore edit errors
    }

    // Process upload
    const result = await processUpload(
      ctx.api,
      sessionDbId,
      session.b2FolderPath ?? session.sessionId,
      photo.fileId,
      currentFileName,
      ctx.from?.id ?? 0
    );

    if (result.success) {
      completedFiles.push(currentFileName);
      totalSizeMB += result.fileSizeMB ?? 0;
    } else {
      failedFiles.push(currentFileName);
    }
  }

  // Final message
  const hasErrors = failedFiles.length > 0;
  let finalMessage = hasErrors
    ? `⚠️ Batch Upload Completed with Errors\n\n`
    : `✅ Batch Upload Complete\n\n`;

  finalMessage += `📁 Session: \`${sessionId}\`\n`;
  finalMessage += `📝 Description: ${description}\n\n`;
  finalMessage += `━━━━━━━━━━━━━━━━\n`;
  finalMessage += `📸 Total: ${batchPhotos.length}\n`;
  finalMessage += `✅ Success: ${completedFiles.length}\n`;
  finalMessage += `❌ Failed: ${failedFiles.length}\n`;
  finalMessage += `💾 Size: ${totalSizeMB.toFixed(1)} MB\n`;
  finalMessage += `━━━━━━━━━━━━━━━━`;

  if (hasErrors) {
    finalMessage += '\n\n❌ Failed files:\n';
    failedFiles.forEach((f, i) => {
      finalMessage += `${i + 1}. ${f}\n`;
    });
  }

  await ctx.api.editMessageText(
    ctx.chat!.id,
    progressMsg.message_id,
    finalMessage,
    { parse_mode: 'Markdown' }
  );

  // Clear batch state
  ctx.session.conversationState = undefined;
  ctx.session.tempData = undefined;

  logger.info(
    `Batch upload complete: ${completedFiles.length}/${batchPhotos.length} files`,
    'BATCH'
  );

  return true;
}
