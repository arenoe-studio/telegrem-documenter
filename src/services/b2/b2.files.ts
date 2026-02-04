
/**
 * B2 File Operations
 * List, Delete, Get Info
 */

import { logger } from '../../utils/logger.js';
import { ensureAuthorized, getB2Client, getBucketId } from './b2.client.js';

/**
 * List files in a session folder
 */
export async function listSessionFiles(
  sessionFolder: string,
  maxFiles: number = 100
): Promise<
  Array<{
    fileId: string;
    fileName: string;
    contentLength: number;
    uploadTimestamp: number;
  }>
> {
  await ensureAuthorized();
  const b2 = getB2Client();
  const bucketId = await getBucketId();

  try {
    const response = await b2.listFileNames({
      bucketId,
      prefix: `${sessionFolder}/`,
      maxFileCount: maxFiles,
    });

    return response.data.files.map(
      (file: {
        fileId: string;
        fileName: string;
        contentLength: number;
        uploadTimestamp: number;
      }) => ({
        fileId: file.fileId,
        fileName: file.fileName,
        contentLength: file.contentLength,
        uploadTimestamp: file.uploadTimestamp,
      })
    );
  } catch (error) {
    logger.error(`Error listing files for ${sessionFolder}`, 'B2', error);
    return [];
  }
}

/**
 * Delete file from B2
 */
export async function deleteFile(
  fileId: string,
  fileName: string
): Promise<boolean> {
  await ensureAuthorized();
  const b2 = getB2Client();

  try {
    await b2.deleteFileVersion({
      fileId,
      fileName,
    });
    logger.info(`File deleted: ${fileName}`, 'B2');
    return true;
  } catch (error) {
    logger.error(`Error deleting file ${fileName}`, 'B2', error);
    return false;
  }
}

/**
 * Delete all files in a session folder
 */
export async function deleteSessionFiles(sessionId: string): Promise<number> {
  await ensureAuthorized();
  const b2 = getB2Client();
  const bucketId = await getBucketId();
  
  let totalDeleted = 0;
  let nextFileName: string | null = null;
  
  try {
    do {
      const response = await b2.listFileNames({
        bucketId: bucketId,
        startFileName: nextFileName || undefined,
        maxFileCount: 100,
        prefix: `${sessionId}/`,
      });

      const files = response.data.files;
      nextFileName = response.data.nextFileName;
      
      if (files.length > 0) {
        // Delete batch
        const deletePromises = files.map((file: any) => 
          b2.deleteFileVersion({
            fileId: file.fileId,
            fileName: file.fileName
          }).catch((err: any) => {
            logger.warn(`Failed to delete file ${file.fileName}`, 'B2', err);
          })
        );
        
        await Promise.all(deletePromises);
        totalDeleted += files.length;
        logger.info(`Deleted batch of ${files.length} files for session ${sessionId}`, 'B2');
      }

    } while (nextFileName);
    
    return totalDeleted;
    
  } catch (error) {
    logger.error(`Error deleting session files for ${sessionId}`, 'B2', error);
    return totalDeleted;
  }
}

/**
 * Get file info
 */
export async function getFileInfo(fileId: string): Promise<{
  fileName: string;
  contentLength: number;
  contentType: string;
  uploadTimestamp: number;
} | null> {
  await ensureAuthorized();
  const b2 = getB2Client();

  try {
    const response = await b2.getFileInfo({ fileId });
    return {
      fileName: response.data.fileName,
      contentLength: response.data.contentLength,
      contentType: response.data.contentType,
      uploadTimestamp: response.data.uploadTimestamp,
    };
  } catch (error) {
    logger.error(`Error getting file info for ${fileId}`, 'B2', error);
    return null;
  }
}
