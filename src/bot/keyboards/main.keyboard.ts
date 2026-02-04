/**
 * Main Menu Keyboard
 * Inline keyboards for main menu (ADMIN vs USER)
 */

import { InlineKeyboard } from 'grammy';

/**
 * Main menu for ADMIN users
 */
export function getAdminMainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🆕 Create New Session', 'menu:create_session')
    .row()
    .text('📂 Choose Existing Session', 'menu:choose_session');
}

/**
 * Main menu for regular USER
 */
export function getUserMainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📂 Choose Existing Session', 'menu:choose_session');
}

/**
 * Get main menu based on role
 */
export function getMainMenu(isAdmin: boolean): InlineKeyboard {
  return isAdmin ? getAdminMainMenu() : getUserMainMenu();
}

/**
 * Back to main menu button
 */
export function getBackToMenuButton(): InlineKeyboard {
  return new InlineKeyboard().text('↩️ Kembali ke Menu', 'menu:back');
}

/**
 * In-session menu (commands available during active session)
 */
export function getSessionActiveMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Status', 'session:status')
    .text('🔄 Refresh', 'session:refresh')
    .row()
    .text('📦 Batch Mode', 'session:batch')
    .row()
    .text('🛑 End Session', 'session:end');
}

/**
 * Help menu
 */
export function getHelpMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📚 Commands', 'help:commands')
    .text('📖 Guide', 'help:guide')
    .row()
    .text('↩️ Kembali ke Menu', 'menu:back');
}
