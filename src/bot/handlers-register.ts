
/**
 * Handler Registration
 * Registers all bot command and event handlers
 */

import { logger } from '../utils/logger.js';
import { createBot, type BotContext } from './bot.js';
import { saveSessionState } from './middlewares/session.middleware.js';

// Handlers
import {
  handleStart,
  handleHelp,
  handleStatus,
  handleEnd,
  handleBackToMenu,
  handleMasterKey,
  handleAdmin,
  handleAdminMasterKeyCallback,
  handleSession,
  handleSessionMenuStatus,
  handleSessionMenuRefresh,
  handleSessionMenuEnd,
  handleSessionMenuClose,
} from './handlers/start.handler.js';
import {
  handleAdminSessions,
  handleAdminSessionDetail,
  handleAdminDeleteConfirm,
  handleAdminDeleteProcess,
} from './handlers/admin.handler.js';
import {
  handleCreateSession,
  handleChooseSession,
  handleSessionConfirm,
  handleSessionCancel,
  routeSessionMessage,
} from './handlers/session.handler.js';
import {
  handlePhoto,
  handleDocument,
  handleRefresh,
} from './handlers/upload.handler.js';
import {
  handleBatchCommand,
  handleEndBatch,
  collectBatchPhoto,
  handleBatchDescription,
  cancelBatch,
} from './handlers/batch.handler.js';

/**
 * Register all bot handlers
 */
export function registerHandlers(bot: ReturnType<typeof createBot>): void {
  // ==========================================
  // Command Handlers
  // ==========================================

  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('status', handleStatus);
  bot.command('end', handleEnd);
  bot.command('refresh', handleRefresh);
  bot.command('batch', handleBatchCommand);
  bot.command('endbatch', handleEndBatch);
  bot.command('masterkey', handleMasterKey);
  bot.command('admin', handleAdmin);
  bot.command('session', handleSession);

  // ==========================================
  // Callback Query Handlers (Inline Buttons)
  // ==========================================

  // Main menu callbacks
  bot.callbackQuery('menu:create_session', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
    await handleCreateSession(ctx);
  });

  bot.callbackQuery('menu:choose_session', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
    await handleChooseSession(ctx);
  });

  bot.callbackQuery('menu:help', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await handleHelp(ctx);
  });

  bot.callbackQuery('menu:back', handleBackToMenu);

  // Admin menu callbacks
  bot.callbackQuery('admin:masterkey', handleAdminMasterKeyCallback);
  bot.callbackQuery('admin:menu', handleAdmin);
  
  // Admin Session Management
  bot.callbackQuery(/^admin:sess:page:(\d+)$/, async (ctx) => {
    const page = ctx.match && ctx.match[1] ? parseInt(ctx.match[1]) : 1;
    await ctx.answerCallbackQuery();
    await handleAdminSessions(ctx, page);
  });
  
  bot.callbackQuery(/^admin:sess:view:(.+)$/, async (ctx) => {
    const sessionId = ctx.match ? ctx.match[1] : '';
    if (sessionId) {
      await ctx.answerCallbackQuery();
      await handleAdminSessionDetail(ctx, sessionId as string);
    }
  });

  bot.callbackQuery(/^admin:sess:del_confirm:(.+)$/, async (ctx) => {
    const sessionId = ctx.match ? ctx.match[1] : '';
    if (sessionId) {
      await ctx.answerCallbackQuery();
      await handleAdminDeleteConfirm(ctx, sessionId as string);
    }
  });

  bot.callbackQuery(/^admin:sess:del_run:(.+)$/, async (ctx) => {
    const sessionId = ctx.match ? ctx.match[1] : '';
    if (sessionId) {
      await ctx.answerCallbackQuery();
      await handleAdminDeleteProcess(ctx, sessionId as string);
    }
  });

  // Session menu callbacks
  bot.callbackQuery('session_menu:status', handleSessionMenuStatus);
  bot.callbackQuery('session_menu:refresh', handleSessionMenuRefresh);
  bot.callbackQuery('session_menu:end', handleSessionMenuEnd);
  bot.callbackQuery('session_menu:close', handleSessionMenuClose);

  // Session creation callbacks
  bot.callbackQuery('session:final_create', handleSessionConfirm);
  bot.callbackQuery('session:cancel_create', handleSessionCancel);
  bot.callbackQuery('session:confirm_create', handleSessionConfirm);

  // Session action callbacks
  bot.callbackQuery('session:status', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await handleStatus(ctx);
  });

  bot.callbackQuery('session:end', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await handleEnd(ctx);
  });

  bot.callbackQuery('session:retry_access', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery();
    await handleChooseSession(ctx);
  });

  // Cancel action
  bot.callbackQuery('action:cancel', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery('Cancelled');
    // Dynamic import to avoid circular dependency if possible, or just use middleware import
    // Ideally session middleware helpers should be in their own file
    // For now we assume ctx.session manipulation is enough but `clearConversationState` helper is useful
    // Let's manually clear for now to avoid import loop or import from middleware if safe
    ctx.session.conversationState = undefined;
    ctx.session.tempData = undefined;
    await handleBackToMenu(ctx);
  });

  // Batch callbacks
  bot.callbackQuery('batch:cancel', async (ctx: BotContext) => {
    await ctx.answerCallbackQuery('Batch cancelled');
    await cancelBatch(ctx);
    await saveSessionState(ctx);
  });

  // ==========================================
  // Message Handler (Text and Photos)
  // ==========================================

  // Handle text messages based on conversation state
  bot.on('message:text', async (ctx: BotContext) => {
    // Handle batch description input
    const batchHandled = await handleBatchDescription(ctx);
    if (batchHandled) {
      await saveSessionState(ctx);
      return;
    }

    // Try to route session-related messages
    const handled = await routeSessionMessage(ctx);

    if (!handled) {
      // If no conversation state, show help
      if (!ctx.session.activeSessionId) {
        await ctx.reply(
          'ℹ️ Gunakan /start untuk membuka menu utama.'
        );
      }
      // If in active session, ignore text messages (waiting for photos)
    }

    // Save state after handling
    await saveSessionState(ctx);
  });

  // Photo handler
  bot.on('message:photo', async (ctx: BotContext) => {
    // Check if in batch mode first
    const batchCollected = await collectBatchPhoto(ctx);
    if (batchCollected) {
      await saveSessionState(ctx);
      return;
    }

    // Single photo upload
    await handlePhoto(ctx);
    await saveSessionState(ctx);
  });

  // Document handler (for photos sent as files)
  bot.on('message:document', async (ctx: BotContext) => {
    // Check if in batch mode first
    const batchCollected = await collectBatchPhoto(ctx);
    if (batchCollected) {
      await saveSessionState(ctx);
      return;
    }

    // Single document upload
    await handleDocument(ctx);
    await saveSessionState(ctx);
  });

  logger.bot('All handlers registered');
}
