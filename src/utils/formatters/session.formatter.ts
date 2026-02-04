
/**
 * Session Formatters
 * Info display and reports
 */

/**
 * Format session info display
 */
export function formatSessionInfo(session: {
  sessionId: string;
  description: string;
  totalFiles: number;
  totalSizeMB: number;
  createdAt: Date;
  status: string;
}): string {
  const dateStr = session.createdAt.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
📁 Session Details
━━━━━━━━━━━━━━━━
📌 ID: ${session.sessionId}
📝 Deskripsi: ${session.description}
📊 Files: ${session.totalFiles} uploaded
💾 Size: ${session.totalSizeMB.toFixed(1)} MB
📅 Created: ${dateStr}
🔄 Status: ${session.status}
━━━━━━━━━━━━━━━━`.trim();
}

/**
 * Format session banner for active session
 */
export function formatSessionBanner(
  sessionId: string,
  description: string,
  fileCount: number
): string {
  return `
✅ Active Session
━━━━━━━━━━━━━━━━
📁 ${sessionId}-${description}
📊 Files: ${fileCount} uploaded
━━━━━━━━━━━━━━━━`.trim();
}

/**
 * Format session created confirmation
 */
export function formatSessionCreated(
  sessionId: string,
  description: string,
  accessKey: string,
  createdAt: Date
): string {
  const dateStr = createdAt.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
✅ Session Created Successfully!

📁 Session Details:
━━━━━━━━━━━━━━━━
📌 ID: ${sessionId}-${description}
🔑 Key: ${accessKey}
📅 Created: ${dateStr}
☁️ Storage: Backblaze B2 bucket initialized
━━━━━━━━━━━━━━━━

Session is ready for use.
Share the key with authorized users.`.trim();
}

/**
 * Format final session report
 */
export function formatSessionReport(
  sessionId: string,
  description: string,
  stats: {
    totalFiles: number;
    successCount: number;
    failedCount: number;
    totalSizeMB: number;
    duration: string;
  },
  failedFiles?: string[]
): string {
  const hasErrors = stats.failedCount > 0;
  const icon = hasErrors ? '⚠️' : '✅';
  const title = hasErrors ? 'Session Ended with Errors' : 'Session Ended Successfully';

  let message = `
${icon} ${title}

Session: ${sessionId}-${description}

📊 Final Report:
━━━━━━━━━━━━━━━━
📸 Total Photos: ${stats.totalFiles}
✅ Successful: ${stats.successCount}
❌ Failed: ${stats.failedCount}
💾 Total Size: ${stats.totalSizeMB.toFixed(1)} MB
⏱️ Duration: ${stats.duration}
━━━━━━━━━━━━━━━━`.trim();

  if (hasErrors && failedFiles && failedFiles.length > 0) {
    message += '\n\n❌ Failed Uploads:';
    for (let i = 0; i < failedFiles.length; i++) {
      message += `\n${i + 1}. ${failedFiles[i]}`;
    }
    message += '\n\n⚠️ These files were NOT uploaded.';
  } else {
    message += '\n\nAll files are safely stored in cloud.';
  }

  message += '\n\nThank you for using Telegram Documenter!';

  return message;
}
