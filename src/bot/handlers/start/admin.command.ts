
/**
 * Admin Commands
 * Handles /admin, /masterkey and related callbacks
 */

import type { BotContext } from '../../bot.js';
import { isAdmin, getAdminByUserId } from '../../middlewares/auth.middleware.js';
import { decrypt } from '../../../services/encryption.service.js';
import { logger } from '../../../utils/logger.js';

/**
 * Handle /masterkey command (ADMIN only)
 */
export async function handleMasterKey(ctx: BotContext): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply('❌ Command ini hanya untuk ADMIN.');
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('❌ Error: User ID tidak ditemukan.');
    return;
  }

  try {
    const admin = await getAdminByUserId(userId);
    
    if (!admin) {
      await ctx.reply('❌ Admin data tidak ditemukan.');
      return;
    }

    const masterKey = decrypt(admin.masterKey);

    await ctx.reply(
      `🔐 Master Key\n\n` +
        `\`${masterKey}\`\n\n` +
        `Gunakan key ini untuk mengakses semua session.`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Admin ${userId} retrieved master key`, 'STARTHANDLER');
  } catch (error) {
    logger.error('Error retrieving master key', 'STARTHANDLER', error);
    await ctx.reply('❌ Error retrieving master key.');
  }
}

/**
 * Handle /admin command
 */
export async function handleAdmin(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;
  
  if (!isAdmin(ctx)) {
    await ctx.reply(
      `ℹ️ Access Denied\n\n` +
        `Anda bukan ADMIN.\n` +
        `Fitur admin tidak tersedia untuk akun Anda.\n\n` +
        `Hubungi administrator jika Anda memerlukan akses.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Admin menu with buttons
  const { InlineKeyboard } = await import('grammy');
  const adminMenu = new InlineKeyboard()
    .text('🔑 Master Key', 'admin:masterkey')
    .row()
    .text('📂 Manage Sessions', 'admin:sess:page:1')
    .row()
    .text('↩️ Kembali', 'menu:back');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(
      `👑 Admin Panel\n\n` +
      `Selamat datang, Admin!\n` +
      `User ID: \`${userId}\`\n\n` +
      `Pilih menu di bawah:`,
      { 
        parse_mode: 'Markdown',
        reply_markup: adminMenu
      }
    );
  } else {
    await ctx.reply(
      `👑 Admin Panel\n\n` +
      `Selamat datang, Admin!\n` +
      `User ID: \`${userId}\`\n\n` +
      `Pilih menu di bawah:`,
      { 
        parse_mode: 'Markdown',
        reply_markup: adminMenu
      }
    );
  }
}

/**
 * Handle admin:masterkey callback
 */
export async function handleAdminMasterKeyCallback(ctx: BotContext): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery('❌ Access denied');
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery('❌ Error');
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    const admin = await getAdminByUserId(userId);
    
    if (!admin) {
      await ctx.editMessageText('❌ Admin data tidak ditemukan.');
      return;
    }

    const masterKey = decrypt(admin.masterKey);

    await ctx.editMessageText(
      `🔐 Master Key\n\n` +
        `\`${masterKey}\`\n\n` +
        `Gunakan key ini untuk mengakses semua session.\n\n` +
        `Klik /admin untuk kembali ke menu admin.`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Admin ${userId} retrieved master key via admin panel`, 'STARTHANDLER');
  } catch (error) {
    logger.error('Error retrieving master key', 'STARTHANDLER', error);
    await ctx.editMessageText('❌ Error retrieving master key.');
  }
}
