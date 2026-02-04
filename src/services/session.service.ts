
/**
 * Session Service (Re-exports)
 */

import { generateSessionId } from './session/session.utils.js';
import { 
  createSession, 
  getSessionBySessionId, 
  getSessionById, 
  getActiveSessions, 
  closeSession, 
  archiveSession,
  getAllSessions,
  deleteSession
} from './session/session.core.js';
import { 
  validateAccessKey, 
  validateMasterKey, 
  trackFailedAttempt, 
  clearFailedAttempts,
  isSessionLocked 
} from './session/session.auth.js';
import { updateSessionStats, getSessionStats } from './session/session.stats.js';

// Re-export specific modules
export { generateSessionId } from './session/session.utils.js';
export * from './session/session.core.js';
export * from './session/session.auth.js';
export * from './session/session.stats.js';

// Default export object for backward compatibility
export const sessionService = {
  generateSessionId,
  createSession,
  getSessionBySessionId,
  getSessionById,
  getActiveSessions,
  validateAccessKey,
  validateMasterKey,
  trackFailedAttempt,
  clearFailedAttempts,
  isSessionLocked,
  updateSessionStats,
  getSessionStats,
  closeSession,
  archiveSession,
  getAllSessions,
  deleteSession
};
