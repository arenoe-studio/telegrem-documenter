
/**
 * Batch Mode Collector
 * Handles photo collection and end batch command
 */

import type { BotContext } from '../../bot.js';
import { formatError } from '../../../utils/formatters.js';

/**
 * Collect photo in batch mode
 */
export async function collectBatchPhoto(ctx: BotContext): Promise<boolean> {
  // Check if in batch mode
  if (ctx.session.conversationState !== 'batch_collecting') {
    return false;
  }

  // Get photo from message
  const photos = ctx.message?.photo;
  const doc = ctx.message?.document;

  let fileId: string;
  let fileName: string;
  let isDocument = false;

  if (photos && photos.length > 0) {
    const photo = photos[photos.length - 1];
    if (!photo) return false;
    fileId = photo.file_id;
    fileName = `photo_${Date.now()}.jpg`;
  } else if (doc && doc.mime_type?.startsWith('image/')) {
    fileId = doc.file_id;
    fileName = doc.file_name ?? `document${Date.now()}.jpg`;
    isDocument = true;
  } else {
    return false;
  }

  // Initialize batch photos array if needed
  if (!ctx.session.tempData) {
    ctx.session.tempData = {};
  }
  if (!ctx.session.tempData.batchPhotos) {
    ctx.session.tempData.batchPhotos = [];
  }

  // Add photo to batch
  ctx.session.tempData.batchPhotos.push({
    fileId,
    fileName,
    isDocument,
  });

  const count = ctx.session.tempData.batchPhotos.length;

  // Send confirmation (only every 5 photos or first photo)
  if (count === 1 || count % 5 === 0) {
    await ctx.reply(
      `📦 Batch: ${count} foto dikumpulkan\n` +
        `Kirim lebih banyak atau /endbatch untuk proses`,
      { parse_mode: 'Markdown' }
    );
  }

  return true;
}

/**
 * Handle /endbatch command - Process batch
 */
export async function handleEndBatch(ctx: BotContext): Promise<void> {
  // Check if in batch mode
  if (ctx.session.conversationState !== 'batch_collecting') {
    await ctx.reply(
      'ℹ️ Anda tidak dalam mode batch.\n\n' +
        'Gunakan /batch untuk memulai mode batch.'
    );
    return;
  }

  const batchPhotos = ctx.session.tempData?.batchPhotos ?? [];

  if (batchPhotos.length === 0) {
    await ctx.reply(
      formatError(
        'No Photos',
        'Tidak ada foto yang dikumpulkan.',
        ['Kirim foto terlebih dahulu', 'Atau gunakan /batch lagi untuk memulai ulang']
      )
    );
    ctx.session.conversationState = undefined;
    ctx.session.tempData = undefined;
    return;
  }

  // Ask for description
  ctx.session.conversationState = 'batch_description';

  await ctx.reply(
    `📦 Batch Ready\n\n` +
      `📸 Total photos: ${batchPhotos.length}\n\n` +
      `Masukkan deskripsi untuk semua foto ini:`,
    { parse_mode: 'Markdown' }
  );
}
