/**
 * Upload Flow Integration Test
 * Verifies the orchestration from download to B2 upload
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('../../src/config/database.js', () => ({
  prisma: {
    upload: {
      create: vi.fn().mockResolvedValue({ id: 'upload-id' }),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    session: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/b2.service.js', () => ({
  b2Service: {
    uploadFile: vi.fn().mockResolvedValue({ 
      success: true, 
      fileId: 'b2-id', 
      fileUrl: 'http://b2.com/file' 
    }),
  },
  buildSessionFilePath: vi.fn().mockReturnValue('SESSION/test.jpg'),
}));

vi.mock('../../src/services/upload/upload.download.js', () => ({
  downloadFromTelegram: vi.fn().mockResolvedValue({
    buffer: Buffer.from('fake-image'),
    mimeType: 'image/jpeg',
    fileSize: 100,
  }),
}));

// Mock stats helper since it's used in core
vi.mock('../../src/services/upload/upload.stats.js', () => ({
  updateUploadStatus: vi.fn().mockResolvedValue({}),
}));

import { processUpload } from '../../src/services/upload/upload.core.js';
import { prisma } from '../../src/config/database.js';
import { b2Service } from '../../src/services/b2.service.js';
import { downloadFromTelegram } from '../../src/services/upload/upload.download.js';

describe('Upload Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should orchestrate a successful upload', async () => {
    // Stage 1: Call processUpload (the orchestrator)
    // Signature: api, sessionDbId, sessionFolder, fileId, originalFileName, uploadedBy
    const result = await processUpload(
      {} as any, // Api mock
      'session-db-id',
      'SESSION-FOLDER',
      'file-id-123',
      'test.jpg',
      123456
    );

    // Verify Stage 1: Download was called
    expect(downloadFromTelegram).toHaveBeenCalledWith(expect.anything(), 'file-id-123');

    // Verify Stage 2: Database record created
    expect(prisma.upload.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        sessionId: 'session-db-id',
        originalName: 'test.jpg',
        uploadStatus: 'PENDING',
      }),
    }));

    // Verify Stage 3: B2 Upload was called
    expect(b2Service.uploadFile).toHaveBeenCalled();

    // Verify Stage 4: Database records updated with success
    expect(prisma.upload.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'upload-id' },
      data: expect.objectContaining({
        uploadStatus: 'COMPLETED',
        b2FileId: 'b2-id',
      }),
    }));

    // Verify Result
    expect(result.success).toBe(true);
    expect(result.uploadId).toBe('upload-id');
  });

  it('should handle download failure gracefully', async () => {
    // Mock download failure
    (downloadFromTelegram as any).mockRejectedValueOnce(new Error('Telegram down'));

    const result = await processUpload(
      {} as any,
      'session-db-id',
      'SESSION-FOLDER',
      'file-id-fail',
      'fail.jpg',
      123456
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Telegram down');
    
    // DB record should still be updated but set to FAILED
    expect(prisma.upload.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'upload-id' },
      data: expect.objectContaining({
        uploadStatus: 'FAILED',
        errorLog: expect.stringContaining('Telegram down'),
      }),
    }));
  });
});
