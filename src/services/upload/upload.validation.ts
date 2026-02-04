
/**
 * Upload Validation
 * File type and size validation
 */

import { validateFileType, validateFileSize } from '../../utils/validators.js';

/**
 * Validate file for upload
 */
export function validateFile(
  buffer: Buffer,
  mimeType: string
): {
  valid: boolean;
  error?: string;
} {
  // Validate file type
  const typeResult = validateFileType(mimeType);
  if (!typeResult.success) {
    return { valid: false, error: typeResult.error };
  }

  // Validate file size (max 20MB)
  const sizeResult = validateFileSize(buffer.length);
  if (!sizeResult.success) {
    return { valid: false, error: sizeResult.error };
  }

  return { valid: true };
}
