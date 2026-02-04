/**
 * Encryption Service
 * AES-256-GCM encryption for access keys, master keys, and OAuth tokens
 */

import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @returns Encrypted string (IV:Tag:Ciphertext in hex)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: IV:TAG:CIPHERTEXT (all in hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param encryptedData - The encrypted string (IV:Tag:Ciphertext in hex)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, tagHex, ciphertext] = parts;

  if (!ivHex || !tagHex || !ciphertext) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a random access key in ABC:DEF:GHI format
 * @returns 9-character access key with colons
 */
export function generateAccessKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(9);

  let key = '';
  for (let i = 0; i < 9; i++) {
    key += chars[bytes[i]! % chars.length];
    if (i === 2 || i === 5) {
      key += ':';
    }
  }

  return key;
}

/**
 * Generate a random master key (12 alphanumeric characters)
 * @returns 12-character master key
 */
export function generateMasterKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(12);

  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars[bytes[i]! % chars.length];
  }

  return key;
}

/**
 * Hash a string with SHA-256 (for file integrity)
 * @param data - Data to hash (string or Buffer)
 * @returns SHA-256 hash in hex
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a string with SHA-1 (for B2 file upload)
 * @param data - Data to hash (Buffer)
 * @returns SHA-1 hash in hex
 */
export function sha1(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

/**
 * Generate a random webhook secret
 * @returns 32-character random string
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Securely compare two strings (timing-safe)
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/**
 * Encryption service object
 */
export const encryptionService = {
  encrypt,
  decrypt,
  generateAccessKey,
  generateMasterKey,
  sha256,
  sha1,
  generateWebhookSecret,
  secureCompare,
};
