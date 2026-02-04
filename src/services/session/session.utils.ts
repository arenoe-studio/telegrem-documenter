
/**
 * Session ID Utilities
 * Generators and formatters
 */

import { prisma } from '../../config/database.js';

/**
 * Generate date code (MMDD format)
 */
function generateDateCode(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}${day}`;
}

/**
 * Get next sequence number for the given prefix and date
 */
async function getNextSequenceNumber(
  prefix: string,
  dateCode: string
): Promise<string> {
  const count = await prisma.session.count({
    where: {
      prefix: prefix.toUpperCase(),
      dateCode,
    },
  });

  const nextNumber = count + 1;
  return String(nextNumber).padStart(2, '0');
}

/**
 * Generate full session ID
 * Format: PREFIX-MMDD-NN
 */
export async function generateSessionId(
  prefix: string
): Promise<{
  sessionId: string;
  prefix: string;
  dateCode: string;
  sequenceNumber: string;
}> {
  const normalizedPrefix = prefix.toUpperCase();
  const dateCode = generateDateCode();
  const sequenceNumber = await getNextSequenceNumber(normalizedPrefix, dateCode);

  const sessionId = `${normalizedPrefix}-${dateCode}-${sequenceNumber}`;

  return {
    sessionId,
    prefix: normalizedPrefix,
    dateCode,
    sequenceNumber,
  };
}
