
/**
 * Session Creation Handler
 * Handles creation of new sessions by admin
 */

import type { BotContext } from '../../bot.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import {
  setConversationState,
  clearConversationState,
  hasActiveSession,
} from '../../middlewares/session.middleware.js';
import { sessionService } from '../../../services/session.service.js';
import { validateSessionPrefix, validateSessionDescription } from '../../../utils/validators.js';
import { formatSessionCreated, formatWarning, formatError } from '../../../utils/formatters.js';
import {
  getCancelKeyboard,
  getSessionFinalConfirmKeyboard,
} from '../../keyboards/session.keyboard.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { logger } from '../../../utils/logger.js';

/**
 * Start session creation flow
 */
export async function handleCreateSession(ctx: BotContext): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply(formatError('Access Denied', 'Hanya ADMIN yang dapat membuat session.'));
    return;
  }

  // Check if already in a session
  if (hasActiveSession(ctx)) {
    await ctx.reply(
      formatWarning(
        'Session Aktif',
        'Anda sedang dalam session aktif. Akhiri session terlebih dahulu.',
        'Gunakan tombol "End Session" atau /end'
      )
    );
    return;
  }

  await ctx.reply(
    `🆕 Create New Session\n\n` +
      `Masukkan PREFIX untuk session ini.\n\n` +
      `📌 Format: 2-3 karakter (huruf/angka)\n` +
      `📋 Contoh: DCM, SRV, AB1\n\n` +
      `Session ID akan di-generate otomatis:\n` +
      `PREFIX-MMDD-NN`,
    { parse_mode: 'Markdown', reply_markup: getCancelKeyboard() }
  );

  await setConversationState(ctx, 'awaiting_prefix');
}

/**
 * Handle prefix input
 */
export async function handlePrefixInput(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;

  if (!text) {
    await ctx.reply('❌ Silakan masukkan teks untuk prefix.');
    return;
  }

  const validation = validateSessionPrefix(text);

  if (!validation.success) {
    await ctx.reply(
      formatError('Prefix Tidak Valid', validation.error, [
        'Gunakan 2-3 karakter',
        'Hanya huruf dan angka yang diperbolehkan',
      ])
    );
    return;
  }

  const prefix = validation.data!;

  // Generate preview session ID
  const { sessionId: previewId } = await sessionService.generateSessionId(prefix);

  // Save temp data
  await setConversationState(ctx, 'awaiting_description', {
    prefix,
    sessionIdPreview: previewId,
  });

  await ctx.reply(
    `✅ Prefix: ${prefix}\n` +
      `📌 Preview ID: \`${previewId}\`\n\n` +
      `Sekarang masukkan DESKRIPSI untuk session ini.\n\n` +
      `📋 Contoh: Survey Jalan Utama, Dokumentasi Gedung A`,
    { parse_mode: 'Markdown', reply_markup: getCancelKeyboard() }
  );
}

/**
 * Handle description input
 */
export async function handleDescriptionInput(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;

  if (!text) {
    await ctx.reply('❌ Silakan masukkan teks untuk deskripsi.');
    return;
  }

  const validation = validateSessionDescription(text);

  if (!validation.success) {
    await ctx.reply(
      formatError('Deskripsi Tidak Valid', validation.error, [
        'Maksimal 100 karakter',
      ])
    );
    return;
  }

  const description = validation.data!;
  const tempData = ctx.session.tempData;

  if (!tempData?.prefix || !tempData?.sessionIdPreview) {
    await ctx.reply(formatError('Session Error', 'Data tidak lengkap. Silakan mulai ulang.'));
    await clearConversationState(ctx);
    return;
  }

  // Show confirmation
  await setConversationState(ctx, 'awaiting_confirmation', {
    ...tempData,
    description,
  });

  await ctx.reply(
    `📋 Konfirmasi Session Baru\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📌 Session ID: \`${tempData.sessionIdPreview}\`\n` +
      `📝 Deskripsi: ${description}\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `Apakah data sudah benar?`,
    { parse_mode: 'Markdown', reply_markup: getSessionFinalConfirmKeyboard() }
  );
}

/**
 * Handle session creation confirmation
 */
export async function handleSessionConfirm(ctx: BotContext): Promise<void> {
  const tempData = ctx.session.tempData;

  if (!tempData?.prefix || !tempData?.description) {
    await ctx.answerCallbackQuery('❌ Data tidak lengkap');
    await clearConversationState(ctx);
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery('❌ Error: User ID tidak ditemukan');
    return;
  }

  await ctx.answerCallbackQuery('⏳ Creating session...');

  try {
    // Create the session
    const { session, accessKey } = await sessionService.createSession(
      userId,
      tempData.prefix,
      tempData.description
    );

    await clearConversationState(ctx);

    // Single bubble: Konfirmasi + ID + Key + Menu
    await ctx.editMessageText(
      `✅ Session Berhasil Dibuat\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `📌 Session ID:\n\`${session.sessionId}\`\n\n` +
        `🔑 Access Key:\n\`${accessKey}\`\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${session.description}\n` +
        `📅 ${session.createdAt.toLocaleDateString('id-ID')}\n\n` +
        `Klik untuk copy ID atau Key di atas`,
      { 
        parse_mode: 'Markdown'
      }
    );

    logger.info(`Session ${session.sessionId} created by ${userId}`, 'SESSION_HANDLER');
  } catch (error) {
    logger.error('Error creating session', 'SESSIONHANDLER', error);
    await ctx.editMessageText(
      formatError('Session Creation Failed', 'Terjadi kesalahan saat membuat session. Silakan coba lagi.')
    );
    await clearConversationState(ctx);
  }
}

/**
 * Handle session creation cancellation
 */
export async function handleSessionCancel(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery('Cancelled');
  await clearConversationState(ctx);

  await ctx.editMessageText(
    '❌ Session creation cancelled.\n\nKembali ke menu utama.',
    { reply_markup: getMainMenu(isAdmin(ctx)) }
  );
}
