
/**
 * Session Statistics
 * Stats retrieval and updates
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Update session statistics after upload
 */
export async function updateSessionStats(
  sessionId: string,
  additionalFiles: number,
  additionalSizeMB: number
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        totalFiles: { increment: additionalFiles },
        totalSizeMB: { increment: additionalSizeMB },
      },
    });
  } catch (error) {
    logger.error(`Error updating session stats for ${sessionId}`, 'SESSION', error);
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId: string): Promise<{
  totalFiles: number;
  totalSizeMB: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
} | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        uploads: {
          select: { uploadStatus: true },
        },
      },
    });

    if (!session) return null;

    const successCount = session.uploads.filter(
      (u: { uploadStatus: string }) => u.uploadStatus === 'COMPLETED'
    ).length;
    const failedCount = session.uploads.filter(
      (u: { uploadStatus: string }) => u.uploadStatus === 'FAILED'
    ).length;
    const pendingCount = session.uploads.filter(
      (u: { uploadStatus: string }) => u.uploadStatus === 'PENDING' || u.uploadStatus === 'UPLOADING'
    ).length;

    return {
      totalFiles: session.totalFiles,
      totalSizeMB: Number(session.totalSizeMB),
      successCount,
      failedCount,
      pendingCount,
    };
  } catch (error) {
    logger.error(`Error getting session stats for ${sessionId}`, 'SESSION', error);
    return null;
  }
}
