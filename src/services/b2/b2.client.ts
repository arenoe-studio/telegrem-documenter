
/**
 * B2 Client Manager
 * Handles B2 instance, authorization, and bucket caching
 */

import B2 from 'backblaze-b2';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ============================================
// B2 Client State
// ============================================

let b2Client: B2 | null = null;
let authExpiry: number | null = null;
let cachedBucketId: string | null = null;

/**
 * Get or create B2 client
 */
export function getB2Client(): B2 {
  if (!b2Client) {
    b2Client = new B2({
      applicationKeyId: env.B2_APPLICATION_KEY_ID,
      applicationKey: env.B2_APPLICATION_KEY,
      retry: {
        retries: 3,
      },
    });
  }
  return b2Client;
}

/**
 * Check if authorization is still valid
 */
function isAuthValid(): boolean {
  if (!authExpiry) return false;
  // Refresh 1 hour before expiry
  return Date.now() < authExpiry - 60 * 60 * 1000;
}

/**
 * Authorize with B2 API
 * Authorization is valid for 24 hours
 */
export async function authorize(): Promise<void> {
  const b2 = getB2Client();

  try {
    await b2.authorize();
    authExpiry = Date.now() + 24 * 60 * 60 * 1000;
    logger.info('B2 authorization successful', 'B2');
  } catch (error) {
    logger.error('B2 authorization failed', 'B2', error);
    throw new Error('Failed to authorize with Backblaze B2');
  }
}

/**
 * Ensure B2 is authorized (call before any operation)
 */
export async function ensureAuthorized(): Promise<void> {
  if (!isAuthValid()) {
    await authorize();
  }
}

/**
 * Get bucket ID (fetch and cache)
 */
export async function getBucketId(): Promise<string> {
  if (cachedBucketId) return cachedBucketId;

  await ensureAuthorized();
  const b2 = getB2Client();

  try {
    const response = await b2.getBucket({
      bucketName: env.B2_BUCKET_NAME,
    });
    const bucketId = response.data.buckets[0]?.bucketId;
    if (bucketId) {
      cachedBucketId = bucketId;
      return cachedBucketId;
    }
    return env.B2_BUCKET_ID;
  } catch (error) {
    logger.warn('Failed to get bucket by name, using env bucket ID', 'B2');
    return env.B2_BUCKET_ID;
  }
}

/**
 * Test B2 connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await ensureAuthorized();
    const bucketId = await getBucketId();
    logger.info(`B2 connection test successful. Bucket ID: ${bucketId}`, 'B2');
    return true;
  } catch (error) {
    logger.error('B2 connection test failed', 'B2', error);
    return false;
  }
}
