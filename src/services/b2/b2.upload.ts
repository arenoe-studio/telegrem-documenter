
/**
 * B2 Upload Manager
 * Core upload logic with retries
 */

import { logger } from '../../utils/logger.js';
import { ensureAuthorized, getB2Client, getBucketId } from './b2.client.js';
import { generateSha1, buildFileUrl, sleep } from './b2.utils.js';

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  contentLength?: number;
  error?: string;
}

/**
 * Get upload URL for bucket
 */
async function getUploadUrl(): Promise<{
  uploadUrl: string;
  authorizationToken: string;
}> {
  await ensureAuthorized();
  const b2 = getB2Client();
  const bucketId = await getBucketId();

  const response = await b2.getUploadUrl({
    bucketId,
  });

  return {
    uploadUrl: response.data.uploadUrl,
    authorizationToken: response.data.authorizationToken,
  };
}

/**
 * Upload file to B2 with retry logic
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg',
  onProgress?: (progress: number) => void,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;

    try {
      // Get fresh upload URL for each attempt
      const { uploadUrl, authorizationToken } = await getUploadUrl();

      // Calculate SHA-1 hash
      const sha1Hash = generateSha1(buffer);

      const b2 = getB2Client();

      // Upload file
      const response = await b2.uploadFile({
        uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName,
        data: buffer,
        hash: sha1Hash,
        mime: mimeType,
        onUploadProgress: onProgress
          ? (event: { loaded: number; total: number }) => {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          : undefined,
      });

      logger.info(
        `File uploaded successfully: ${fileName} (attempt ${attempt})`,
        'B2'
      );

      return {
        success: true,
        fileId: response.data.fileId,
        fileName: response.data.fileName,
        fileUrl: buildFileUrl(response.data.fileName),
        contentLength: response.data.contentLength,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Upload attempt ${attempt} failed: ${lastError.message}`,
        'B2',
        (error as any).response?.data || error
      );

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await sleep(waitTime);
      }
    }
  }

  logger.error(
    `Upload failed after ${maxRetries} attempts: ${fileName}`,
    'B2',
    lastError
  );

  return {
    success: false,
    error: lastError?.message ?? 'Upload failed after retries',
  };
}
