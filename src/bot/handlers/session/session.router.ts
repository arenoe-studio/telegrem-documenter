
/**
 * Session Message Router
 * Routes messages to appropriate handlers based on state
 */

import type { BotContext } from '../../bot.js';
import { handlePrefixInput, handleDescriptionInput } from './session.creation.js';
import { handleSessionIdInput, handleAccessKeyInput } from './session.access.js';

/**
 * Route messages based on conversation state
 */
export async function routeSessionMessage(ctx: BotContext): Promise<boolean> {
  const state = ctx.session.conversationState;

  switch (state) {
    case 'awaiting_prefix':
      await handlePrefixInput(ctx);
      return true;

    case 'awaiting_description':
      await handleDescriptionInput(ctx);
      return true;

    case 'awaiting_session_id':
      await handleSessionIdInput(ctx);
      return true;

    case 'awaiting_access_key':
      await handleAccessKeyInput(ctx);
      return true;

    default:
      return false;
  }
}
