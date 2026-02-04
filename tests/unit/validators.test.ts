/**
 * Validator Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateSessionId,
  validateAccessKey,
  validateFile,
  validateMasterKey,
  validateSessionPrefix
} from '../../src/utils/validators.js';

describe('Validators', () => {
  describe('Session ID', () => {
    it('should validate correct session IDs', () => {
      expect(validateSessionId('DCM-0914-01').success).toBe(true);
      expect(validateSessionId('ABC-1234-99').success).toBe(true);
    });

    it('should reject invalid session IDs', () => {
      expect(validateSessionId('INVALID').success).toBe(false);
      expect(validateSessionId('DCM-0914').success).toBe(false); // too short
      expect(validateSessionId('DCM091401').success).toBe(false); // wrong format
    });
  });

  describe('Session Prefix', () => {
    it('should validate correct prefixes', () => {
      expect(validateSessionPrefix('DCM').success).toBe(true);
      expect(validateSessionPrefix('AB').success).toBe(true);
    });

    it('should reject invalid prefixes', () => {
      expect(validateSessionPrefix('A').success).toBe(false); // too short
      expect(validateSessionPrefix('ABCD').success).toBe(false); // too long
      expect(validateSessionPrefix('123').success).toBe(true); // alnum ok
      expect(validateSessionPrefix('A-B').success).toBe(false); // no special chars
    });
  });

  describe('Access Key', () => {
    it('should validate correct access keys', () => {
      expect(validateAccessKey('ABC:DEF:GHI').success).toBe(true);
    });

    it('should reject invalid access keys', () => {
      expect(validateAccessKey('ABCDEFGHI').success).toBe(false); // missing colons
      expect(validateAccessKey('ABC:DEF').success).toBe(false); // too short
      expect(validateAccessKey('ABC:DEF:GHIJ').success).toBe(false); // too long
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      expect(validateFile('image/jpeg', 1000).success).toBe(true);
      expect(validateFile('image/png', 1000).success).toBe(true);
    });

    it('should reject disallowed file types', () => {
      expect(validateFile('application/pdf', 1000).success).toBe(false);
      expect(validateFile('image/gif', 1000).success).toBe(false); // Assuming only jpg/png allowed per config
    });

    it('should validate file sizes', () => {
      const MAX_SIZE = 20 * 1024 * 1024; // 20MB
      expect(validateFile('image/jpeg', MAX_SIZE).success).toBe(true);
      expect(validateFile('image/jpeg', MAX_SIZE + 1).success).toBe(false);
    });
  });
});
