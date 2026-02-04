
/**
 * Progress Indicators
 * Progress bars and status messages
 */

/**
 * Create text-based progress bar
 */
export function createProgressBar(percentage: number, length: number = 20): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format upload progress message
 */
export function formatUploadProgress(
  filename: string,
  sessionIdOrPercentage: string | number,
  percentageOrUploadedMB?: number,
  statusMessageOrTotalMB?: string | number
): string {
  // New signature: (filename, sessionId, percentage, statusMessage)
  if (typeof sessionIdOrPercentage === 'string') {
    const sessionId = sessionIdOrPercentage;
    const percentage = percentageOrUploadedMB ?? 0;
    const statusMessage = statusMessageOrTotalMB as string ?? 'Processing...';

    let message = `📤 Uploading to Cloud\n\n`;
    message += `${createProgressBar(percentage)} ${percentage}%\n\n`;
    message += `📄 ${filename}\n`;
    message += `📁 Session: \`${sessionId}\`\n\n`;
    message += `${statusMessage}`;

    return message;
  }

  // Old signature: (filename, percentage, uploadedMB?, totalMB?)
  const percentage = sessionIdOrPercentage;
  const uploadedMB = percentageOrUploadedMB;
  const totalMB = statusMessageOrTotalMB as number;

  let message = `📤 Mengupload...\n\n`;
  message += `${createProgressBar(percentage)} ${percentage}%\n\n`;
  message += `📄 ${filename}`;

  if (uploadedMB !== undefined && totalMB !== undefined) {
    message += `\n💾 ${uploadedMB.toFixed(1)} MB / ${totalMB.toFixed(1)} MB`;
  }

  return message;
}

/**
 * Format batch upload progress
 */
export function formatBatchProgress(
  current: number,
  total: number,
  completedFiles: string[],
  currentFile?: string,
  pendingFiles?: string[]
): string {
  const percentage = Math.round((current / total) * 100);

  let message = `📦 Batch Upload Progress\n\n`;
  message += `${createProgressBar(percentage)} ${current}/${total}\n`;

  if (completedFiles.length > 0) {
    for (const file of completedFiles) {
      message += `\n✅ ${file}`;
    }
  }

  if (currentFile) {
    message += `\n⏳ ${currentFile} (uploading...)`;
  }

  if (pendingFiles && pendingFiles.length > 0) {
    for (const file of pendingFiles) {
      message += `\n⏹️ ${file} (pending)`;
    }
  }

  return message;
}
