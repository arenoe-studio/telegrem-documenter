
/**
 * Session Menu Handlers
 * Handles /session command and session menu callbacks
 */

import type { BotContext } from '../../bot.js';
import { handleStatus, handleEnd } from './status.command.js';

/**
 * Handle /session command - Show session menu
 */
export async function handleSession(ctx: BotContext): Promise<void> {
  const sessionDbId = ctx.session.activeSessionDbId;
  const sessionId = ctx.session.activeSessionId;

  if (!sessionDbId || !sessionId) {
    await ctx.reply(
      '❌ Tidak ada session aktif.\n\n' +
        'Gunakan /start untuk membuat atau memilih session.'
    );
    return;
  }

  const { InlineKeyboard } = await import('grammy');
  const sessionMenu = new InlineKeyboard()
    .text('📊 Check Status', 'session_menu:status')
    .row()
    .text('🔄 Refresh', 'session_menu:refresh')
    .row()
    .text('🛑 End Session', 'session_menu:end')
    .row()
    .text('↩️ Close', 'session_menu:close');

  await ctx.reply(
    `🎛️ Session Menu\n\n` +
      `📌 Session: \`${sessionId}\`\n\n` +
      `Pilih aksi:`,
    {
      parse_mode: 'Markdown',
      reply_markup: sessionMenu
    }
  );
}

/**
 * Handle session menu callbacks
 */
export async function handleSessionMenuStatus(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
  await handleStatus(ctx);
}

export async function handleSessionMenuRefresh(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
  
  // Dynamic import to avoid circular dependency
  const { handleRefresh } = await import('../upload.handler.js');
  await handleRefresh(ctx);
}

export async function handleSessionMenuEnd(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
  await handleEnd(ctx);
}

export async function handleSessionMenuClose(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
}
