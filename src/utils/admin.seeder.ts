
/**
 * Admin Seeder
 * Seeds admin users from environment variables
 */

import { env } from '../config/env.js';
import { logger } from './logger.js';
import { encryptionService } from '../services/encryption.service.js';
import { 
  createAdmin, 
  getAdminByUserId 
} from '../bot/middlewares/auth.middleware.js';

/**
 * Seed admins from environment variables
 */
export async function seedAdmins(): Promise<void> {
  if (env.TELEGRAM_ADMIN_IDS.length > 0) {
    logger.info(`Seeding ${env.TELEGRAM_ADMIN_IDS.length} admins from env...`, 'APP');
    
    for (const adminId of env.TELEGRAM_ADMIN_IDS) {
      try {
        const existing = await getAdminByUserId(adminId);
        if (!existing) {
          const masterKey = encryptionService.generateMasterKey();
          const encryptedKey = encryptionService.encrypt(masterKey);
          await createAdmin(adminId, undefined, encryptedKey);
          
          logger.info(`Admin seeded: ${adminId}`, 'APP');
          
          // Log explicitly to console for first-time visibility
          console.log(`\n🔐 [ADMIN SEED] New Admin ${adminId} created.`);
          console.log(`🔑 [MASTER KEY] ${masterKey} (Save this!)\n`);
        }
      } catch (error) {
        logger.error(`Failed to seed admin ${adminId}`, 'APP', error);
      }
    }
  }
}
