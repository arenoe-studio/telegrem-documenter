
/**
 * Start & Help Commands
 */

import type { BotContext } from '../../bot.js';
import { isAdmin } from '../../middlewares/auth.middleware.js';
import { hasActiveSession } from '../../middlewares/session.middleware.js';
import { getMainMenu } from '../../keyboards/main.keyboard.js';
import { formatSessionBanner } from '../../../utils/formatters.js';
import { sessionService } from '../../../services/session.service.js';
import { logger } from '../../../utils/logger.js';

/**
 * Handle /start command
 */
export async function handleStart(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;
  const username = ctx.from?.first_name ?? ctx.from?.username ?? 'User';
  const role = ctx.session.role ?? 'USER';

  logger.bot(`/start from ${userId} (@${ctx.from?.username}) - Role: ${role}`);

  // Check if user has active session
  if (hasActiveSession(ctx)) {
    const sessionId = ctx.session.activeSessionId!;
    const sessionDbId = ctx.session.activeSessionDbId!;
    const stats = await sessionService.getSessionStats(sessionDbId);
    const session = await sessionService.getSessionById(sessionDbId);

    await ctx.reply(
      `🏠 Telegram Documenter\n\n` +
        `Selamat datang kembali, ${username}!\n` +
        `Role: ${role}\n\n` +
        formatSessionBanner(
          sessionId,
          session?.description ?? '',
          stats?.totalFiles ?? 0
        ) +
        `\n\n📸 Kirim foto untuk upload.\n` +
        `Atau gunakan menu di bawah.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Show main menu
  await ctx.reply(
    `🏠 Telegram Documenter\n\n` +
      `Selamat datang, ${username}!\n` +
      `Role: ${role}\n\n` +
      `Pilih opsi di bawah untuk memulai:`,
    { parse_mode: 'Markdown', reply_markup: getMainMenu(isAdmin(ctx)) }
  );
}

/**
 * Handle /help command
 */
export async function handleHelp(ctx: BotContext): Promise<void> {
  const role = ctx.session.role ?? 'USER';

  let helpText = `❓ Telegram Documenter Help\n\n`;

  if (role === 'ADMIN') {
    helpText +=
      `👑 ADMIN Commands:\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `/start - Menu utama\n` +
      `/help - Bantuan\n` +
      `/status - Status upload & statistik\n` +
      `/end - Akhiri session aktif\n` +
      `/refresh - Refresh & retry failed uploads\n` +
      `/batch - Aktifkan batch mode\n\n`;
  } else {
    helpText +=
      `📚 Commands:\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `/start - Menu utama\n` +
      `/help - Bantuan\n` +
      `/status - Status upload\n` +
      `/end - Akhiri session aktif\n` +
      `/batch - Aktifkan batch mode\n\n`;
  }

  helpText +=
    `📸 Cara Upload:\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `1. Pilih atau akses session\n` +
    `2. Kirim foto langsung ke chat\n` +
    `3. Tunggu upload selesai\n\n` +
    `💡 Tips:\n` +
    `• Kirim foto sebagai "File" untuk menjaga kualitas\n` +
    `• Gunakan batch mode untuk upload banyak foto\n` +
    `• Foto dengan GPS akan otomatis di-extract`;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
}

/**
 * Handle back to menu callback
 */
export async function handleBackToMenu(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();

  const username = ctx.from?.first_name ?? ctx.from?.username ?? 'User';
  const role = ctx.session.role ?? 'USER';

  // Check if user has active session
  if (hasActiveSession(ctx)) {
    await ctx.editMessageText(
      `🏠 Telegram Documenter\n\n` +
        `Anda masih dalam session aktif: \`${ctx.session.activeSessionId}\`\n\n` +
        `Pilih opsi di bawah:`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.editMessageText(
    `🏠 Telegram Documenter\n\n` +
      `Selamat datang, ${username}!\n` +
      `Role: ${role}\n\n` +
      `Pilih opsi di bawah untuk memulai:`,
    { parse_mode: 'Markdown', reply_markup: getMainMenu(isAdmin(ctx)) }
  );
}
