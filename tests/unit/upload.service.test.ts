/**
 * Upload Service Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { validateFile } from '../../src/services/upload/upload.validation.js';

describe('Upload Validation', () => {
  it('should validate correct image types', () => {
    const buffer = Buffer.alloc(100);
    expect(validateFile(buffer, 'image/jpeg').valid).toBe(true);
    expect(validateFile(buffer, 'image/png').valid).toBe(true);
  });

  it('should reject invalid mime types', () => {
    const buffer = Buffer.alloc(100);
    expect(validateFile(buffer, 'application/pdf').valid).toBe(false);
    expect(validateFile(buffer, 'text/plain').valid).toBe(false);
    expect(validateFile(buffer, 'image/gif').valid).toBe(false);
  });

  it('should reject files that are too large', () => {
    const LARGE_SIZE = 21 * 1024 * 1024; // 21MB
    const buffer = Buffer.alloc(LARGE_SIZE);
    expect(validateFile(buffer, 'image/jpeg').valid).toBe(false);
  });
});
