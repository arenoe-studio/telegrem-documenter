
/**
 * Backblaze B2 Service (Re-exports)
 */

import { authorize, ensureAuthorized, testConnection } from './b2/b2.client.js';
import { uploadFile, type UploadResult } from './b2/b2.upload.js';
import { 
  listSessionFiles, 
  deleteFile, 
  deleteSessionFiles, 
  getFileInfo 
} from './b2/b2.files.js';
import { 
  generateSha1, 
  buildSessionFilePath 
} from './b2/b2.utils.js';

// Re-export individually
export { authorize, ensureAuthorized, testConnection } from './b2/b2.client.js';
export { uploadFile, type UploadResult } from './b2/b2.upload.js';
export { 
  listSessionFiles, 
  deleteFile, 
  deleteSessionFiles, 
  getFileInfo 
} from './b2/b2.files.js';
export { 
  generateSha1, 
  buildSessionFilePath, 
} from './b2/b2.utils.js';

// Default export object for backward compatibility
export const b2Service = {
  authorize,
  ensureAuthorized,
  uploadFile,
  buildSessionFilePath,
  listSessionFiles,
  deleteFile,
  deleteSessionFiles,
  getFileInfo,
  testConnection,
  generateSha1,
};
