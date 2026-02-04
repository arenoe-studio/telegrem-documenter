
/**
 * Upload Downloader
 * Downloads files from Telegram
 */

import { Api } from 'grammy';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Download file from Telegram servers
 */
export async function downloadFromTelegram(
  api: Api,
  fileId: string
): Promise<{
  buffer: Buffer;
  fileSize: number;
  mimeType?: string;
} | null> {
  try {
    // Get file info from Telegram
    const file = await api.getFile(fileId);

    if (!file.file_path) {
      logger.error('No file path returned from Telegram', 'UPLOAD');
      return null;
    }

    // Download file
    const response = await fetch(
      `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    );

    if (!response.ok) {
      logger.error(`Failed to download file: ${response.status}`, 'UPLOAD');
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Infer mime type from file path
    let mimeType = 'image/jpeg';
    const ext = file.file_path.split('.').pop()?.toLowerCase();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';

    return {
      buffer,
      fileSize: file.file_size ?? buffer.length,
      mimeType,
    };
  } catch (error) {
    logger.error(
      'Error downloading file from Telegram',
      'UPLOAD',
      error instanceof Error
        ? { message: error.message, stack: error.stack, fileId }
        : { error, fileId }
    );
    return null;
  }
}
