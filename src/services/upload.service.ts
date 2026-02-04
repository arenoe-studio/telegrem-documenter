
/**
 * Upload Service (Re-exports)
 */

import { downloadFromTelegram } from './upload/upload.download.js';
import { validateFile } from './upload/upload.validation.js';
import { processUpload } from './upload/upload.core.js';
import { 
  getUploadStats, 
  getFailedUploads, 
  markForRetry, 
  getPendingCount 
} from './upload/upload.stats.js';

// Re-export types
export type { 
  UploadProgress, 
  ProcessUploadResult, 
  UploadStats 
} from './upload/upload.types.js';

// Re-export specific modules
export { downloadFromTelegram } from './upload/upload.download.js';
export { validateFile } from './upload/upload.validation.js';
export { processUpload } from './upload/upload.core.js';
export { 
  getUploadStats, 
  getFailedUploads, 
  markForRetry, 
  getPendingCount 
} from './upload/upload.stats.js';

// Default export object for backward compatibility
export const uploadService = {
  downloadFromTelegram,
  validateFile,
  processUpload,
  getUploadStats,
  getFailedUploads,
  markForRetry,
  getPendingCount,
};
