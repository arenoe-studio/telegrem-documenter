
/**
 * Application Entry Point
 * Main orchestration logic
 */

import express, { Request, Response } from 'express';
import { webhookCallback } from 'grammy';
import { createBot } from './bot/bot.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { seedAdmins } from './utils/admin.seeder.js';
import { registerHandlers } from './bot/handlers-register.js';

// Middlewares
import { authMiddleware } from './bot/middlewares/auth.middleware.js';
import { loadSessionState } from './bot/middlewares/session.middleware.js';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  logger.info('Starting Telegram Documenter...', 'APP');

  // 1. Connect to database
  await connectDatabase();

  // 2. Seed admins
  await seedAdmins();

  // 3. Create bot instance
  const bot = createBot();

  // 4. Register middlewares
  bot.use(authMiddleware);
  bot.use(loadSessionState);

  // 5. Register handlers
  registerHandlers(bot);

  // 6. Set bot commands menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Mulai bot & buka menu utama' },
    { command: 'help', description: 'Bantuan & panduan penggunaan' },
    { command: 'session', description: 'Menu session aktif' },
    { command: 'batch', description: 'Mulai mode batch upload' },
    { command: 'endbatch', description: 'Proses batch upload' },
    { command: 'admin', description: '[ADMIN] Panel admin' },
  ]);
  logger.info('Bot commands menu set', 'APP');

  // 7. Setup Express Server
  const app = express();

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Webhook endpoint
  if (env.NODE_ENV === 'production' && env.WEBHOOK_URL) {
    // Production: Use webhook
    app.use(express.json());
    app.post(
      '/webhook',
      webhookCallback(bot, 'express', {
        secretToken: env.TELEGRAM_WEBHOOK_SECRET,
      })
    );

    // Set webhook URL
    await bot.api.setWebhook(`${env.WEBHOOK_URL}/webhook`, {
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    });
    logger.info(`Webhook set to ${env.WEBHOOK_URL}/webhook`, 'APP');
  } else {
    // Development: Use long polling
    logger.info('Starting bot in development mode (long polling)', 'APP');

    // Delete webhook if exists
    await bot.api.deleteWebhook();

    // Start polling
    bot.start({
      onStart: (botInfo) => {
        logger.info(`Bot @${botInfo.username} started (polling mode)`, 'APP');
      },
    });
  }

  // 8. Start Express server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, 'APP');
  });

  // 9. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`, 'APP');

    // Stop accepting new connections
    server.close();

    // Stop bot
    await bot.stop();

    // Disconnect from database
    await disconnectDatabase();

    logger.info('Shutdown complete', 'APP');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Run Application
main().catch((error) => {
  logger.error('Fatal error during startup', 'APP', error);
  process.exit(1);
});
