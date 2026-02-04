/**
 * Validators
 * Zod schemas for input validation throughout the application
 */

import { z } from 'zod';

// ============================================
// Session ID Validation
// Format: PREFIX-MMDD-NN or PREFIX-MMDD-NN-Description
// ============================================

/**
 * Session prefix schema (2-3 alphanumeric characters)
 */
export const sessionPrefixSchema = z
  .string()
  .min(2, 'Prefix harus minimal 2 karakter')
  .max(3, 'Prefix maksimal 3 karakter')
  .regex(/^[A-Za-z0-9]+$/, 'Prefix hanya boleh huruf dan angka')
  .transform((val) => val.toUpperCase());

/**
 * Session ID schema (PREFIX-MMDD-NN format)
 */
export const sessionIdSchema = z
  .string()
  .min(9, 'Session ID terlalu pendek')
  .regex(
    /^[A-Za-z0-9]{2,3}-\d{4}-\d{2}$/,
    'Format Session ID tidak valid. Gunakan format: PREFIX-MMDD-NN (contoh: DCM-0914-02)'
  )
  .transform((val) => val.toUpperCase());

/**
 * Full session ID with description
 */
export const fullSessionIdSchema = z
  .string()
  .min(10, 'Session ID terlalu pendek')
  .regex(
    /^[A-Za-z0-9]{2,3}-\d{4}-\d{2}(-.*)?$/,
    'Format Session ID tidak valid'
  );

// ============================================
// Access Key Validation
// Format: ABC:DEF:GHI (9 chars with colons)
// ============================================

/**
 * Access key schema (ABC:DEF:GHI format)
 */
export const accessKeySchema = z
  .string()
  .length(11, 'Access key harus 11 karakter (termasuk colon)')
  .regex(
    /^[A-Za-z0-9]{3}:[A-Za-z0-9]{3}:[A-Za-z0-9]{3}$/,
    'Format access key tidak valid. Gunakan format: ABC:DEF:GHI'
  );

/**
 * Master key schema (12 alphanumeric characters)
 */
export const masterKeySchema = z
  .string()
  .length(12, 'Master key harus 12 karakter')
  .regex(/^[A-Za-z0-9]+$/, 'Master key hanya boleh huruf dan angka');

// ============================================
// File Validation
// ============================================

/**
 * Allowed photo MIME types
 */
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;

/**
 * Maximum file size in bytes (20 MB)
 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * File type validation schema
 */
export const fileTypeSchema = z.enum(ALLOWED_PHOTO_TYPES, {
  errorMap: () => ({
    message: 'Tipe file tidak didukung. Gunakan JPG, JPEG, atau PNG',
  }),
});

/**
 * File size validation schema
 */
export const fileSizeSchema = z
  .number()
  .max(MAX_FILE_SIZE, `Ukuran file maksimal ${MAX_FILE_SIZE / 1024 / 1024} MB`);

// ============================================
// Description Validation
// ============================================

/**
 * Session description schema
 */
export const sessionDescriptionSchema = z
  .string()
  .min(1, 'Deskripsi tidak boleh kosong')
  .max(100, 'Deskripsi maksimal 100 karakter')
  .transform((val) => val.trim());

/**
 * Photo description schema
 */
export const photoDescriptionSchema = z
  .string()
  .max(500, 'Deskripsi foto maksimal 500 karakter')
  .transform((val) => val.trim());

// ============================================
// Telegram User ID Validation
// ============================================

/**
 * Telegram user ID schema
 */
export const telegramUserIdSchema = z
  .number()
  .int()
  .positive('User ID harus bilangan positif');

// ============================================
// Utility Functions
// ============================================

/**
 * Validate session prefix
 */
export function validateSessionPrefix(prefix: string): { success: boolean; data?: string; error?: string } {
  const result = sessionPrefixSchema.safeParse(prefix);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Validate session ID
 */
export function validateSessionId(sessionId: string): { success: boolean; data?: string; error?: string } {
  const result = sessionIdSchema.safeParse(sessionId);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Validate access key format
 */
export function validateAccessKey(key: string): { success: boolean; data?: string; error?: string } {
  const result = accessKeySchema.safeParse(key);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Validate master key format
 */
export function validateMasterKey(key: string): { success: boolean; data?: string; error?: string } {
  const result = masterKeySchema.safeParse(key);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Validate file for upload
 */
export function validateFile(
  mimeType: string,
  sizeBytes: number
): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  const typeResult = fileTypeSchema.safeParse(mimeType);
  if (!typeResult.success) {
    errors.push(typeResult.error.errors[0]?.message ?? 'Tipe file tidak valid');
  }

  const sizeResult = fileSizeSchema.safeParse(sizeBytes);
  if (!sizeResult.success) {
    errors.push(sizeResult.error.errors[0]?.message ?? 'Ukuran file terlalu besar');
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Validate session description
 */
export function validateSessionDescription(description: string): { success: boolean; data?: string; error?: string } {
  const result = sessionDescriptionSchema.safeParse(description);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): { success: boolean; error?: string } {
  const result = fileTypeSchema.safeParse(mimeType);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.errors[0]?.message ?? 'Tipe file tidak valid' };
}

/**
 * Validate file size
 */
export function validateFileSize(sizeBytes: number): { success: boolean; error?: string } {
  const result = fileSizeSchema.safeParse(sizeBytes);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.errors[0]?.message ?? 'Ukuran file terlalu besar' };
}

