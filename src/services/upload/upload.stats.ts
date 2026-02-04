
/**
 * Upload Statistics & Management
 * Stats, Retries, Pending Counts
 */

import { prisma } from '../../config/database.js';
import type { UploadStats } from './upload.types.js';

/**
 * Update upload status in database
 */
export async function updateUploadStatus(
  uploadId: string,
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
): Promise<void> {
  await prisma.upload.update({
    where: { id: uploadId },
    data: { uploadStatus: status },
  });
}

/**
 * Get upload statistics for a session
 */
export async function getUploadStats(sessionId: string): Promise<UploadStats> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      uploads: {
        select: { uploadStatus: true },
      },
    },
  });

  if (!session) {
    return {
      totalFiles: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      totalSizeMB: 0,
    };
  }

  const successCount = session.uploads.filter(
    (u: { uploadStatus: string }) => u.uploadStatus === 'COMPLETED'
  ).length;
  const failedCount = session.uploads.filter(
    (u: { uploadStatus: string }) => u.uploadStatus === 'FAILED'
  ).length;
  const pendingCount = session.uploads.filter(
    (u: { uploadStatus: string }) =>
      u.uploadStatus === 'PENDING' || u.uploadStatus === 'UPLOADING'
  ).length;

  return {
    totalFiles: session.totalFiles,
    totalSizeMB: Number(session.totalSizeMB),
    successCount,
    failedCount,
    pendingCount,
  };
}

/**
 * Get failed uploads for a session
 */
export async function getFailedUploads(sessionId: string) {
  return prisma.upload.findMany({
    where: {
      sessionId,
      uploadStatus: 'FAILED',
    },
    orderBy: { uploadedAt: 'asc' },
  });
}

/**
 * Retry a failed upload (mark for retry)
 */
export async function markForRetry(uploadId: string): Promise<void> {
  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      uploadStatus: 'RETRYING',
      errorLog: null,
    },
  });
}

/**
 * Get pending/retrying uploads count
 */
export async function getPendingCount(sessionId: string): Promise<number> {
  return prisma.upload.count({
    where: {
      sessionId,
      uploadStatus: { in: ['PENDING', 'UPLOADING', 'RETRYING'] },
    },
  });
}
