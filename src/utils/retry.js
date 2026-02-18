import { delay } from './delay.js';
import { logger } from './logger.js';

/**
 * Retry wrapper — ลอง execute fn หลายครั้งกรณี fail
 * @param {Function} fn - async function ที่ต้องการ retry
 * @param {object} options
 * @param {number} options.maxRetries - จำนวนครั้งที่ retry (default: 3)
 * @param {number} options.delayMs - delay ระหว่าง retry (default: 5000)
 * @param {string} options.label - ชื่อ operation สำหรับ log
 */
export async function withRetry(fn, { maxRetries = 3, delayMs = 5000, label = 'operation' } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`${label} failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

      if (attempt < maxRetries) {
        const waitTime = delayMs * attempt; // exponential-ish backoff
        logger.info(`Retrying ${label} in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }

  logger.error(`${label} failed after ${maxRetries} attempts`);
  throw lastError;
}
