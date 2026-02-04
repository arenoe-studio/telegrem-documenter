/**
 * Environment Configuration
 * Centralized environment variable handling with Zod validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret is required'),
  TELEGRAM_ADMIN_IDS: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
    }),

  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),

  // Backblaze B2
  B2_APPLICATION_KEY_ID: z.string().min(1, 'B2 key ID is required'),
  B2_APPLICATION_KEY: z.string().min(1, 'B2 application key is required'),
  B2_BUCKET_ID: z.string().min(1, 'B2 bucket ID is required'),
  B2_BUCKET_NAME: z.string().min(1, 'B2 bucket name is required'),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .min(64, 'Encryption key must be 32 bytes (64 hex characters)')
    .max(64, 'Encryption key must be 32 bytes (64 hex characters)'),

  // Server
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WEBHOOK_URL: z.string().url('Invalid webhook URL').optional(),
});

/**
 * Parse and validate environment variables
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const error of result.error.errors) {
      console.error(`   - ${error.path.join('.')}: ${error.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment configuration
 */
export const env = validateEnv();

/**
 * Type for environment configuration
 */
export type Env = z.infer<typeof envSchema>;
