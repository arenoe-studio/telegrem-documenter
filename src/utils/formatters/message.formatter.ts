
/**
 * Message Templates
 * General response formats
 */

/**
 * Format success message
 */
export function formatSuccess(title: string, details?: string, nextSteps?: string): string {
  let message = `✅ ${title}`;

  if (details) {
    message += `\n\n${details}`;
  }

  if (nextSteps) {
    message += `\n\n${nextSteps}`;
  }

  return message;
}

/**
 * Format error message
 */
export function formatError(
  title: string,
  details?: string,
  suggestions?: string[],
  errorCode?: string
): string {
  let message = `❌ ${title}`;

  if (details) {
    message += `\n\nDetail: ${details}`;
  }

  if (suggestions && suggestions.length > 0) {
    message += '\n\nSaran:';
    for (const suggestion of suggestions) {
      message += `\n• ${suggestion}`;
    }
  }

  if (errorCode) {
    message += `\n\nKode error: ${errorCode}`;
  }

  return message;
}

/**
 * Format warning message
 */
export function formatWarning(title: string, details?: string, action?: string): string {
  let message = `⚠️ ${title}`;

  if (details) {
    message += `\n\n${details}`;
  }

  if (action) {
    message += `\n\n${action}`;
  }

  return message;
}

/**
 * Format info message
 */
export function formatInfo(title: string, details?: string): string {
  let message = `ℹ️ ${title}`;

  if (details) {
    message += `\n\n${details}`;
  }

  return message;
}
