
/**
 * Statistics Formatters
 */

/**
 * Format upload statistics
 */
export function formatUploadStats(stats: {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  totalSizeMB: number;
  duration?: string;
}): string {
  return `
📊 Upload Statistics
━━━━━━━━━━━━━━━━
📸 Total Photos: ${stats.totalFiles}
✅ Successful: ${stats.successCount}
❌ Failed: ${stats.failedCount}
💾 Total Size: ${stats.totalSizeMB.toFixed(1)} MB
${stats.duration ? `⏱️ Duration: ${stats.duration}` : ''}
━━━━━━━━━━━━━━━━`.trim();
}
