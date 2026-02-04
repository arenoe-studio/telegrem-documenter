
/**
 * Session Access Handler
 * Handles joining existing sessions
 */

import type { BotContext } from '../../bot.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import {
  setConversationState,
  clearConversationState,
  hasActiveSession,
  setActiveSession,
} from '../../middlewares/session.middleware.js';
import {
  sessionService,
  validateAccessKey,
  trackFailedAttempt,
  clearFailedAttempts,
  isSessionLocked,
  getSessionBySessionId,
  getSessionStats,
} from '../../../services/session.service.js';
import { validateSessionId, validateAccessKey as validateAccessKeyFormat } from '../../../utils/validators.js';
import { formatSuccess, formatError, formatWarning, formatSessionBanner } from '../../../utils/formatters.js';
import {
  getCancelKeyboard,
  getSessionRetryKeyboard,
  getSessionLockedKeyboard,
} from '../../keyboards/session.keyboard.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { logger } from '../../../utils/logger.js';

/**
 * Start session access flow
 */
export async function handleChooseSession(ctx: BotContext): Promise<void> {
  // Check if already in a session
  if (hasActiveSession(ctx)) {
    await ctx.reply(
      formatWarning(
        'Session Aktif',
        `Anda sedang dalam session: ${ctx.session.activeSessionId}`,
        'Akhiri session terlebih dahulu untuk memilih session lain.'
      )
    );
    return;
  }

  await ctx.reply(
    `📂 Choose Session\n\n` +
      `Masukkan Session ID yang ingin diakses.\n\n` +
      `📌 Format: PREFIX-MMDD-NN\n` +
      `📋 Contoh: DCM-0914-02`,
    { parse_mode: 'Markdown', reply_markup: getCancelKeyboard() }
  );

  await setConversationState(ctx, 'awaiting_session_id');
}

/**
 * Handle session ID input
 */
export async function handleSessionIdInput(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;

  if (!text) {
    await ctx.reply('❌ Silakan masukkan Session ID.');
    return;
  }

  const validation = validateSessionId(text);

  if (!validation.success) {
    await ctx.reply(
      formatError('Session ID Tidak Valid', validation.error, [
        'Gunakan format: PREFIX-MMDD-NN',
        'Contoh: DCM-0914-02',
      ]),
      { reply_markup: getSessionRetryKeyboard() }
    );
    return;
  }

  const sessionId = validation.data!;
  const userId = ctx.from?.id;

  if (!userId) {
    await ctx.reply(formatError('Error', 'User ID tidak ditemukan.'));
    return;
  }

  // Check if session exists
  const session = await getSessionBySessionId(sessionId);

  if (!session) {
    await ctx.reply(
      formatError('Session Tidak Ditemukan', `Session ID ${sessionId} tidak ditemukan.`, [
        'Periksa kembali Session ID',
        'Hubungi ADMIN untuk session ID yang benar',
      ]),
      { reply_markup: getSessionRetryKeyboard() }
    );
    return;
  }

  if (session.status !== 'ACTIVE') {
    await ctx.reply(
      formatError('Session Tidak Aktif', `Session ${sessionId} sudah ${session.status.toLowerCase()}.`, [
        'Hubungi ADMIN untuk informasi lebih lanjut',
      ]),
      { reply_markup: getMainMenu(isAdmin(ctx)) }
    );
    await clearConversationState(ctx);
    return;
  }

  // Check if user is locked out
  const lockStatus = await isSessionLocked(sessionId, userId);
  if (lockStatus.locked) {
    await ctx.reply(
      formatError(
        'Session Terkunci',
        `Anda terkunci dari session ini selama ${lockStatus.remainingMinutes} menit.`,
        ['Tunggu hingga waktu lockout berakhir', 'Atau hubungi ADMIN']
      ),
      { reply_markup: getSessionLockedKeyboard() }
    );
    await clearConversationState(ctx);
    return;
  }

  // Save session ID temporarily and ask for access key
  await setConversationState(ctx, 'awaiting_access_key', {
    sessionId: session.sessionId,
    sessionDbId: session.id,
    description: session.description,
  });

  await ctx.reply(
    `📂 Session: ${session.sessionId}\n` +
      `📝 ${session.description}\n\n` +
      `Masukkan Access Key untuk session ini.\n\n` +
      `📌 Format: ABC:DEF:GHI`,
    { parse_mode: 'Markdown', reply_markup: getCancelKeyboard() }
  );
}

/**
 * Handle access key input
 */
export async function handleAccessKeyInput(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;
  const userId = ctx.from?.id;

  if (!text || !userId) {
    await ctx.reply('❌ Silakan masukkan Access Key.');
    return;
  }

  const tempData = ctx.session.tempData as {
    sessionId?: string;
    sessionDbId?: string;
    description?: string;
  };

  if (!tempData?.sessionId || !tempData?.sessionDbId) {
    await ctx.reply(formatError('Error', 'Session data tidak ditemukan. Silakan mulai ulang.'));
    await clearConversationState(ctx);
    return;
  }

  // Check if admin is using master key (before format validation)
  if (isAdmin(ctx)) {
    const isMasterKey = await sessionService.validateMasterKey(userId, text);
    if (isMasterKey) {
      // Admin using master key - grant access
      await grantSessionAccess(ctx, tempData.sessionDbId, tempData.sessionId, tempData.description ?? '');
      return;
    }
  }

  // Validate format (only if not master key)
  const formatValidation = validateAccessKeyFormat(text);
  if (!formatValidation.success) {
    await ctx.reply(
      formatError('Format Tidak Valid', formatValidation.error, [
        'Gunakan format: ABC:DEF:GHI',
        'Total 9 karakter dengan 2 colon',
      ])
    );
    return;
  }

  // Validate access key
  const result = await validateAccessKey(tempData.sessionId, text);

  if (result.valid && result.session) {
    // Clear failed attempts
    await clearFailedAttempts(tempData.sessionId, userId);

    // Grant access
    await grantSessionAccess(ctx, result.session.id, result.session.sessionId, result.session.description);
  } else {
    // Track failed attempt
    const lockResult = await trackFailedAttempt(tempData.sessionId, userId);

    if (lockResult.locked) {
      await ctx.reply(
        formatError(
          'Session Terkunci',
          `Terlalu banyak percobaan gagal. Session terkunci selama ${lockResult.lockoutMinutes} menit.`
        ),
        { reply_markup: getSessionLockedKeyboard() }
      );
      await clearConversationState(ctx);
    } else {
      await ctx.reply(
        formatError(
          'Access Key Salah',
          result.error ?? 'Key tidak cocok.',
          [`Sisa percobaan: ${lockResult.remainingAttempts}`]
        ),
        { reply_markup: getCancelKeyboard() }
      );
    }
  }
}

/**
 * Grant access to session
 */
async function grantSessionAccess(
  ctx: BotContext,
  sessionDbId: string,
  sessionId: string,
  description: string
): Promise<void> {
  await clearConversationState(ctx);
  await setActiveSession(ctx, sessionDbId, sessionId);

  const stats = await getSessionStats(sessionDbId);

  await ctx.reply(
    `${formatSuccess('Access Granted', `Session ${sessionId} berhasil diakses.`)}\n\n` +
      formatSessionBanner(sessionId, description, stats?.totalFiles ?? 0) +
      `\n\n📸 Kirim foto untuk mulai upload.\n` +
      `Gunakan /session untuk menu session.`
  );

  logger.info(`User ${ctx.from?.id} accessed session ${sessionId}`, 'SESSION_HANDLER');
}
