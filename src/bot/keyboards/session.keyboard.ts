/**
 * Session Keyboard
 * Inline keyboards for session-related actions
 */

import { InlineKeyboard } from 'grammy';

/**
 * Session creation confirmation
 */
export function getSessionConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Continue', 'session:confirm_create')
    .text('❌ Cancel', 'session:cancel_create');
}

/**
 * Session creation final confirmation
 */
export function getSessionFinalConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Create Session', 'session:final_create')
    .text('❌ Cancel', 'session:cancel_create');
}

/**
 * Session access retry options
 */
export function getSessionRetryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 Try Again', 'session:retry_access')
    .text('↩️ Back to Menu', 'menu:back');
}

/**
 * Session end confirmation (with uploads in progress)
 */
export function getSessionEndConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('⛔ Force End', 'session:force_end')
    .text('↩️ Continue Session', 'session:continue');
}

/**
 * Session end with failed uploads
 */
export function getSessionEndWithFailedKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 Retry Failed Uploads', 'session:retry_failed')
    .text('❌ End Without Retry', 'session:end_no_retry');
}

/**
 * Cancel button only
 */
export function getCancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('❌ Cancel', 'action:cancel');
}

/**
 * Yes/No confirmation
 */
export function getYesNoKeyboard(
  yesCallback: string,
  noCallback: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Yes', yesCallback)
    .text('❌ No', noCallback);
}

/**
 * Session locked message with back button
 */
export function getSessionLockedKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('↩️ Kembali ke Menu', 'menu:back');
}

/**
 * Access granted - ready to upload
 */
export function getAccessGrantedKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Check Status', 'session:status')
    .row()
    .text('🛑 End Session', 'session:end');
}
