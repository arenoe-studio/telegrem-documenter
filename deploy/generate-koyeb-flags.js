/**
 * Utility script to generate Koyeb CLI environment variable flags
 * Usage: node deploy/generate-koyeb-flags.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log('\n======================================================');
console.log('🔹 KOYEB CLI FLAGS GENERATOR');
console.log('======================================================\n');

// 1. Generate Flags for the BOT Service
console.log('🤖 [BOT SERVICE] Copy these flags to your "koyeb service create/update" command:\n');

const botKeys = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'DATABASE_URL',
  'B2_APPLICATION_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_ID',
  'B2_BUCKET_NAME',
  'ENCRYPTION_KEY',
  'NODE_ENV',
  'WEBHOOK_URL'
];

let botFlags = '';
botKeys.forEach(key => {
  if (envConfig[key]) {
    // Quote values if they contain spaces or special chars
    const value = envConfig[key];
    botFlags += `--env ${key}="${value}" `;
  }
});

console.log(botFlags.trim());

console.log('\n\n------------------------------------------------------\n');

// 2. Generate Flags for the FILESTASH Service
console.log('📂 [FILESTASH SERVICE] Copy these flags for your Filestash service:\n');

// Mapping .env (B2) values to Filestash (S3) variables
const filestashMap = {
  'ONLY_PLUGINS': 's3',
  'S3_ENDPOINT': `s3.${envConfig['S3_REGION'] || 'us-east-005'}.backblazeb2.com`, // Fallback or needs manual input if not in .env logic
  // Assuming user might not have S3_REGION in .env yet, let's try to derive or use placeholders if missing
  'S3_REGION': envConfig['S3_REGION'] || 'us-east-005', 
  'S3_ACCESS_KEY_ID': envConfig['B2_APPLICATION_KEY_ID'],
  'S3_SECRET_ACCESS_KEY': envConfig['B2_APPLICATION_KEY'],
  'S3_BUCKET': envConfig['B2_BUCKET_NAME'],
  'INIT_ADMIN_PASSWORD': envConfig['INIT_ADMIN_PASSWORD'] || 'CHANGE_ME_NOW_123', // prioritize .env
  'APPLICATION_URL': envConfig['WEBHOOK_URL'] ? envConfig['WEBHOOK_URL'].replace('bot', 'files') : 'https://your-app.koyeb.app'
};

let filestashFlags = '';
Object.entries(filestashMap).forEach(([key, value]) => {
  if (value) {
    filestashFlags += `--env ${key}="${value}" `;
  }
});

console.log(filestashFlags.trim());

console.log('\n\n======================================================');
