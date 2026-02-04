
import { BotContext } from '../bot.js';
import { InlineKeyboard } from 'grammy';
import * as sessionService from '../../services/session.service.js';
import { b2Service } from '../../services/b2.service.js';
import { isAdmin } from '../middlewares/auth.middleware.js';
import { logger } from '../../utils/logger.js';
import { decrypt } from '../../services/encryption.service.js';

// Constants
const ITEMS_PER_PAGE = 5;

/**
 * Handle admin sessions list (pagination)
 */
export async function handleAdminSessions(
  ctx: BotContext, 
  page: number = 1
): Promise<void> {
  if (!isAdmin(ctx)) return;

  try {
    const data = await sessionService.getAllSessions(page, ITEMS_PER_PAGE);
    
    let message = `📂 *Manage Sessions* (Page ${page}/${data.pages})\n\n`;
    const keyboard = new InlineKeyboard();

    if (data.sessions.length === 0) {
      message += '_Belum ada session yang dibuat._';
    } else {
      for (const session of data.sessions) {
        // Row for each session
        const statusIcon = session.status === 'ACTIVE' ? '🟢' : '⚫';
        const fileCount = session._count?.uploads ?? 0;
        
        keyboard.text(
          `${statusIcon} ${session.sessionId} (${fileCount} files)`, 
          `admin:sess:view:${session.id}`
        ).row();
      }
    }

    // Pagination buttons
    const navRow = [];
    if (page > 1) {
      navRow.push({ text: '⬅️ Prev', callback_data: `admin:sess:page:${page - 1}` });
    }
    navRow.push({ text: '↩️ Menu Admin', callback_data: 'admin:menu' });
    if (page < data.pages) {
      navRow.push({ text: 'Next ➡️', callback_data: `admin:sess:page:${page + 1}` });
    }
    
    // Add pagination row
    if (navRow.length > 0) {
      navRow.forEach(btn => keyboard.text(btn.text, btn.callback_data));
    }

    // Update message or send new one
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } else {
      await ctx.reply(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    }

  } catch (error) {
    logger.error('Error fetching sessions', 'ADMIN', error);
    await ctx.reply('❌ Error fetching sessions data.');
  }
}

/**
 * View session detail
 */
export async function handleAdminSessionDetail(
  ctx: BotContext, 
  sessionId: string
): Promise<void> {
  if (!isAdmin(ctx)) return;

  try {
    const session = await sessionService.getSessionById(sessionId);
    
    if (!session) {
      await ctx.answerCallbackQuery('❌ Session not found');
      return;
    }

    const accessKey = decrypt(session.accessKey);
    const status = session.status === 'ACTIVE' ? '🟢 Active' : '⚫ Ended';
    const createdAt = session.createdAt ? new Date(session.createdAt).toLocaleDateString('id-ID') : '-';

    // Get stats
    const stats = await sessionService.getSessionStats(session.id);
    const totalFiles = stats?.totalFiles ?? 0;
    const totalSize = stats?.totalSizeMB ? `${stats.totalSizeMB.toFixed(2)} MB` : '0 MB';

    const message = 
      `📂 *Session Detail*\n\n` +
      `🆔 ID: \`${session.sessionId}\`\n` +
      `🔑 Key: \`${accessKey}\`\n` +
      `📝 Desc: ${session.description}\n` +
      `📅 Created: ${createdAt}\n` +
      `📊 Status: ${status}\n\n` +
      `📁 Files: ${totalFiles}\n` +
      `💾 Size: ${totalSize}`;

    const keyboard = new InlineKeyboard()
      .text('🗑️ Hapus Session', `admin:sess:del_confirm:${session.id}`)
      .row()
      .text('↩️ Kembali ke List', `admin:sess:page:1`);

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

  } catch (error) {
    logger.error(`Error viewing session ${sessionId}`, 'ADMIN', error);
    await ctx.answerCallbackQuery('❌ Error viewing session');
  }
}

/**
 * Confirm delete session
 */
export async function handleAdminDeleteConfirm(
  ctx: BotContext, 
  sessionId: string
): Promise<void> {
  if (!isAdmin(ctx)) return;

  const keyboard = new InlineKeyboard()
    .text('✅ Ya, Hapus Permanen', `admin:sess:del_run:${sessionId}`)
    .row()
    .text('❌ Batal', `admin:sess:view:${sessionId}`);

  await ctx.editMessageText(
    `⚠️ *KONFIRMASI PENGHAPUSAN*\n\n` +
    `Apakah Anda yakin ingin menghapus session ini?\n\n` +
    `❗️ *PERINGATAN:*\n` +
    `- Semua data di database akan dihapus\n` +
    `- Semua file di Backblaze (Cloud) akan dihapus\n` +
    `- Tindakan ini TIDAK BISA DIBATALKAN.`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );
}

/**
 * Process delete session
 */
export async function handleAdminDeleteProcess(
  ctx: BotContext, 
  sessionId: string
): Promise<void> {
  if (!isAdmin(ctx)) return;

  try {
    // Show loading
    await ctx.editMessageText('⏳ *Processing...*\n\nMenghapus data dari database dan cloud storage...', {
      parse_mode: 'Markdown'
    });

    const session = await sessionService.getSessionById(sessionId);
    if (!session) {
      await ctx.editMessageText('❌ Session sudah tidak ada.');
      return;
    }

    try {
      // 1. Delete files from B2
      const folderName = session.b2FolderPath || session.sessionId;
      await ctx.editMessageText('⏳ *Processing...*\n\nMenghapus files dari B2 Cloud Storage...', {
        parse_mode: 'Markdown'
      });
      
      const deletedCount = await b2Service.deleteSessionFiles(folderName);
      logger.info(`Deleted ${deletedCount} files from B2 for session ${folderName}`, 'ADMIN');
      
    } catch (b2Error) {
      logger.error('Error cleaning up B2', 'ADMIN', b2Error);
      // Continue to DB deletion even if B2 fails partially
    }

    // 2. Delete from DB
    await sessionService.deleteSession(sessionId);

    // 3. Success message
    const keyboard = new InlineKeyboard()
      .text('↩️ Kembali ke List', 'admin:sess:page:1');

    await ctx.editMessageText(
      `✅ *Session Deleted*\n\n` +
      `Session \`${session.sessionId}\` berhasil dihapus dari sistem.`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

    logger.info(`Session ${session.sessionId} deleted by admin ${ctx.from?.id}`, 'ADMIN');

  } catch (error) {
    logger.error(`Error deleting session ${sessionId}`, 'ADMIN', error);
    await ctx.editMessageText(
      `❌ *Delete Failed*\n\nGagal menghapus session. Cek logs.`, 
      { parse_mode: 'Markdown' }
    );
  }
}
