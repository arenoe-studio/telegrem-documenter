
/**
 * Upload Core Processing
 * Orchestrates the upload flow
 */

import { Api } from 'grammy';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { b2Service, buildSessionFilePath } from '../b2.service.js';
import { downloadFromTelegram } from './upload.download.js';
import { validateFile } from './upload.validation.js';
import { updateUploadStatus } from './upload.stats.js';
import type { UploadProgress, ProcessUploadResult } from './upload.types.js';

/**
 * Process a single photo upload
 */
export async function processUpload(
  api: Api,
  sessionDbId: string,
  sessionFolder: string,
  fileId: string,
  originalFileName: string,
  uploadedBy: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<ProcessUploadResult> {
  // Create upload record in database
  const upload = await prisma.upload.create({
    data: {
      sessionId: sessionDbId,
      filename: originalFileName,
      originalName: originalFileName,
      fileSizeMB: 0,
      uploadedBy: BigInt(uploadedBy),
      uploadStatus: 'PENDING',
    },
  });

  const uploadId = upload.id;

  try {
    // Update status: downloading
    onProgress?.({
      uploadId,
      status: 'downloading',
      progress: 0,
      message: '⬇️ Downloading from Telegram...',
    });

    await updateUploadStatus(uploadId, 'UPLOADING');

    // Download from Telegram
    const downloadResult = await downloadFromTelegram(api, fileId);

    if (!downloadResult) {
      throw new Error('Failed to download file from Telegram');
    }

    const { buffer, fileSize, mimeType } = downloadResult;
    const fileSizeMB = fileSize / (1024 * 1024);

    // Validate file
    const validation = validateFile(buffer, mimeType ?? 'image/jpeg');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update status: uploading
    onProgress?.({
      uploadId,
      status: 'uploading',
      progress: 30,
      message: '⬆️ Uploading to cloud...',
    });

    // Check for duplicate filename and get sequence number
    const existingCount = await prisma.upload.count({
      where: {
        sessionId: sessionDbId,
        originalName: originalFileName,
        id: { not: uploadId },
      },
    });
    const sequenceNumber = existingCount + 1;

    // Build file path
    const filePath = buildSessionFilePath(
      sessionFolder,
      originalFileName,
      sequenceNumber
    );

    // Upload to B2
    const uploadResult = await b2Service.uploadFile(
      buffer,
      filePath,
      mimeType,
      (progress) => {
        onProgress?.({
          uploadId,
          status: 'uploading',
          progress: 30 + Math.round(progress * 0.6), // 30-90%
          message: `⬆️ Uploading: ${progress}%`,
        });
      }
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error ?? 'Upload to B2 failed');
    }

    // Update database record
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        filename: filePath,
        fileSizeMB,
        b2FileId: uploadResult.fileId,
        b2FileUrl: uploadResult.fileUrl,
        uploadStatus: 'COMPLETED',
        uploadedAt: new Date(),
      },
    });

    // Update session statistics
    await prisma.session.update({
      where: { id: sessionDbId },
      data: {
        totalFiles: { increment: 1 },
        totalSizeMB: { increment: fileSizeMB },
      },
    });

    onProgress?.({
      uploadId,
      status: 'completed',
      progress: 100,
      message: '✅ Upload complete!',
    });

    logger.info(
      `Upload completed: ${filePath} (${fileSizeMB.toFixed(2)} MB)`,
      'UPLOAD'
    );

    return {
      success: true,
      uploadId,
      fileUrl: uploadResult.fileUrl,
      fileName: filePath,
      fileSizeMB,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Update database with failure
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        uploadStatus: 'FAILED',
        errorLog: errorMessage,
      },
    });

    onProgress?.({
      uploadId,
      status: 'failed',
      progress: 0,
      message: `❌ Upload failed: ${errorMessage}`,
    });

    logger.error(`Upload failed: ${originalFileName}`, 'UPLOAD', error);

    return {
      success: false,
      uploadId,
      error: errorMessage,
    };
  }
}
