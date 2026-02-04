
/**
 * Session Authentication & Locking
 * Key validation and failed attempt tracking
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { decrypt, secureCompare } from '../encryption.service.js';
import { getSessionBySessionId } from './session.core.js';

/**
 * Validate access key for a session
 */
export async function validateAccessKey(
  sessionId: string,
  inputKey: string
): Promise<{
  valid: boolean;
  session?: Awaited<ReturnType<typeof getSessionBySessionId>>;
  error?: string;
}> {
  try {
    const session = await getSessionBySessionId(sessionId);

    if (!session) {
      return { valid: false, error: 'Session tidak ditemukan' };
    }

    if (session.status !== 'ACTIVE') {
      return { valid: false, error: 'Session sudah ditutup' };
    }

    // Decrypt stored key
    const storedKey = decrypt(session.accessKey);

    // Secure comparison
    if (secureCompare(inputKey, storedKey)) {
      return { valid: true, session };
    }

    return { valid: false, error: 'Access key salah' };
  } catch (error) {
    logger.error(`Error validating access key for ${sessionId}`, 'SESSION', error);
    return { valid: false, error: 'Terjadi kesalahan saat validasi' };
  }
}

/**
 * Validate master key for admin
 */
export async function validateMasterKey(
  adminUserId: number,
  inputKey: string
): Promise<boolean> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { telegramUserId: BigInt(adminUserId) },
    });

    if (!admin) {
      return false;
    }

    const storedKey = decrypt(admin.masterKey);
    return secureCompare(inputKey, storedKey);
  } catch (error) {
    logger.error(`Error validating master key for ${adminUserId}`, 'SESSION', error);
    return false;
  }
}

// ============================================
// Session Lock Management
// ============================================

const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 3;

/**
 * Track failed access attempt
 */
export async function trackFailedAttempt(
  sessionId: string,
  telegramUserId: number
): Promise<{
  locked: boolean;
  remainingAttempts: number;
  lockoutMinutes?: number;
}> {
  try {
    const now = new Date();

    // Check existing lock
    const lock = await prisma.sessionLock.findUnique({
      where: {
        sessionId_telegramUserId: {
          sessionId,
          telegramUserId: BigInt(telegramUserId),
        },
      },
    });

    if (lock) {
      // Check if lockout has expired
      if (lock.lockedUntil && lock.lockedUntil > now) {
        const remainingMs = lock.lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        return {
          locked: true,
          remainingAttempts: 0,
          lockoutMinutes: remainingMinutes,
        };
      }

      // Lockout expired, reset or increment
      if (lock.lockedUntil && lock.lockedUntil <= now) {
        // Reset after lockout expires
        await prisma.sessionLock.update({
          where: { id: lock.id },
          data: {
            failedAttempts: 1,
            lockedUntil: null,
          },
        });
        return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
      }

      // Increment failed attempts
      const newAttempts = lock.failedAttempts + 1;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the session
        await prisma.sessionLock.update({
          where: { id: lock.id },
          data: {
            failedAttempts: newAttempts,
            lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS),
          },
        });
        return {
          locked: true,
          remainingAttempts: 0,
          lockoutMinutes: 15,
        };
      }

      await prisma.sessionLock.update({
        where: { id: lock.id },
        data: { failedAttempts: newAttempts },
      });

      return {
        locked: false,
        remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts,
      };
    }

    // Create new lock record
    await prisma.sessionLock.create({
      data: {
        sessionId,
        telegramUserId: BigInt(telegramUserId),
        failedAttempts: 1,
      },
    });

    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  } catch (error) {
    logger.error('Error tracking failed attempt', 'SESSION', error);
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
}

/**
 * Clear failed attempts on successful login
 */
export async function clearFailedAttempts(
  sessionId: string,
  telegramUserId: number
): Promise<void> {
  try {
    await prisma.sessionLock.deleteMany({
      where: {
        sessionId,
        telegramUserId: BigInt(telegramUserId),
      },
    });
  } catch (error) {
    logger.error('Error clearing failed attempts', 'SESSION', error);
  }
}

/**
 * Check if session is locked for user
 */
export async function isSessionLocked(
  sessionId: string,
  telegramUserId: number
): Promise<{
  locked: boolean;
  remainingMinutes?: number;
}> {
  try {
    const lock = await prisma.sessionLock.findUnique({
      where: {
        sessionId_telegramUserId: {
          sessionId,
          telegramUserId: BigInt(telegramUserId),
        },
      },
    });

    if (!lock || !lock.lockedUntil) {
      return { locked: false };
    }

    const now = new Date();
    if (lock.lockedUntil > now) {
      const remainingMs = lock.lockedUntil.getTime() - now.getTime();
      return {
        locked: true,
        remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
      };
    }

    return { locked: false };
  } catch (error) {
    logger.error('Error checking session lock', 'SESSION', error);
    return { locked: false };
  }
}
