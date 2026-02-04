
/**
 * Session Core Operations
 * CRUD operations for sessions
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { encrypt, generateAccessKey } from '../encryption.service.js';
import { generateSessionId } from './session.utils.js';

/**
 * Create a new session
 */
export async function createSession(
  createdBy: number,
  prefix: string,
  description: string
) {
  // Generate session ID
  const { sessionId, prefix: normalizedPrefix, dateCode, sequenceNumber } =
    await generateSessionId(prefix);

  // Generate and encrypt access key
  const accessKey = generateAccessKey();
  const encryptedKey = encrypt(accessKey);

  // Create B2 folder path
  const b2FolderPath = `${sessionId}-${description.replace(/\s+/g, '-')}`;

  // Create session in database
  const session = await prisma.session.create({
    data: {
      sessionId,
      prefix: normalizedPrefix,
      dateCode,
      sequenceNumber,
      description,
      accessKey: encryptedKey,
      createdBy: BigInt(createdBy),
      b2FolderPath,
      status: 'ACTIVE',
    },
  });

  logger.info(
    `Session created: ${sessionId} by user ${createdBy}`,
    'SESSION'
  );

  return {
    session,
    accessKey, // Return plain key for admin
  };
}

/**
 * Get session by session ID
 */
export async function getSessionBySessionId(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionId.toUpperCase() },
    });
    return session;
  } catch (error) {
    logger.error(`Error fetching session ${sessionId}`, 'SESSION', error);
    return null;
  }
}

/**
 * Get session by database ID
 */
export async function getSessionById(id: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id },
    });
    return session;
  } catch (error) {
    logger.error(`Error fetching session by id ${id}`, 'SESSION', error);
    return null;
  }
}

/**
 * Get all active sessions
 */
export async function getActiveSessions() {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  } catch (error) {
    logger.error('Error fetching active sessions', 'SESSION', error);
    return [];
  }
}

/**
 * Close a session
 */
export async function closeSession(sessionId: string) {
  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    });
    logger.info(`Session closed: ${session.sessionId}`, 'SESSION');
    return session;
  } catch (error) {
    logger.error(`Error closing session ${sessionId}`, 'SESSION', error);
    return null;
  }
}

/**
 * Archive a session
 */
export async function archiveSession(sessionId: string) {
  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ARCHIVED' },
    });
    logger.info(`Session archived: ${session.sessionId}`, 'SESSION');
    return session;
  } catch (error) {
    logger.error(`Error archiving session ${sessionId}`, 'SESSION', error);
    return null;
  }
}

/**
 * Get all sessions with pagination (Admin)
 */
export async function getAllSessions(page: number = 1, limit: number = 5) {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { uploads: true },
        },
      },
    }),
    prisma.session.count(),
  ]);

  return {
    sessions,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

/**
 * Delete session and all related data from database
 */
export async function deleteSession(id: string) {
  return await prisma.session.delete({
    where: { id },
  });
}
