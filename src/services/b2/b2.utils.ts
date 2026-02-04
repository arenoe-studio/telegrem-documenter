
/**
 * B2 Utilities
 * Stateless helper functions
 */

import { createHash } from 'crypto';
import { env } from '../../config/env.js';

/**
 * Generate SHA-1 hash of buffer
 */
export function generateSha1(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex');
}

/**
 * Build public file URL
 */
export function buildFileUrl(fileName: string): string {
  // Backblaze B2 public URL format
  return `https://f005.backblazeb2.com/file/${env.B2_BUCKET_NAME}/${fileName}`;
}

/**
 * Generate file path for session folder
 */
export function buildSessionFilePath(
  sessionFolder: string,
  originalFileName: string,
  sequenceNumber?: number
): string {
  // Sanitize folder name
  const sanitizedFolder = sessionFolder.replace(/[^a-zA-Z0-9\-_]/g, '_');

  // Sanitize file name
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');

  // Add sequence number for duplicates
  if (sequenceNumber !== undefined && sequenceNumber > 1) {
    const ext = sanitizedFileName.split('.').pop() ?? 'jpg';
    const base = sanitizedFileName.replace(`.${ext}`, '');
    return `${sanitizedFolder}/${base}_${sequenceNumber}.${ext}`;
  }

  return `${sanitizedFolder}/${sanitizedFileName}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
