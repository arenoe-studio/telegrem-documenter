
/**
 * Upload Service Types
 */

export interface UploadProgress {
  uploadId: string;
  status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'failed';
  progress: number;
  message: string;
}

export interface ProcessUploadResult {
  success: boolean;
  uploadId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeMB?: number;
  error?: string;
}

export interface UploadStats {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  totalSizeMB: number;
}
