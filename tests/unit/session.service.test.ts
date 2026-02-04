/**
 * Session Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionId } from '../../src/services/session/session.utils.js';

// Mock Prisma
vi.mock('../../src/config/database.js', () => ({
  prisma: {
    session: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Session Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionId', () => {
    it('should generate ID with correct format', async () => {
      const { prisma } = await import('../../src/config/database.js');
      
      // Mock count = 0 (no existing sessions)
      (prisma.session.count as any).mockResolvedValue(0);

      const result = await generateSessionId('PROJ');
      
      const now = new Date();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const expectedDateCode = `${month}${day}`;

      expect(result.sessionId).toBe(`PROJ-${expectedDateCode}-01`);
      expect(result.prefix).toBe('PROJ');
      expect(result.dateCode).toBe(expectedDateCode);
      expect(result.sequenceNumber).toBe('01');
    });

    it('should increment sequence number for same date', async () => {
      const { prisma } = await import('../../src/config/database.js');
      
      const now = new Date();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const dateCode = `${month}${day}`;

      // Mock existing session count = 1
      (prisma.session.count as any).mockResolvedValue(1);

      const result = await generateSessionId('PROJ');

      expect(result.sessionId).toBe(`PROJ-${dateCode}-02`);
      expect(result.sequenceNumber).toBe('02');
    });
  });
});
