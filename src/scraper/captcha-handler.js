import { logger } from '../utils/logger.js';
import { settings } from '../config/settings.js';
import { delay } from '../utils/delay.js';

/**
 * ตรวจจับและจัดการ Captcha / Verification page
 * @param {import('@ulixee/hero').default} hero
 * @returns {boolean} true ถ้าเจอ captcha
 */
export async function detectCaptcha(hero) {
  for (const selector of settings.SELECTORS.CAPTCHA) {
    try {
      const element = hero.document.querySelector(selector);
      if (element && (await element.$isVisible)) {
        logger.warn(`Captcha detected with selector: ${selector}`);
        return true;
      }
    } catch {
      // selector ไม่เจอ — ข้ามไป
    }
  }
  return false;
}

/**
 * รอให้ captcha หายไป (กรณีผู้ใช้แก้เอง หรือ auto-resolve)
 * @param {import('@ulixee/hero').default} hero
 * @param {number} timeoutMs - timeout รอ captcha
 */
export async function waitForCaptchaResolution(hero, timeoutMs = 60000) {
  logger.info('Waiting for captcha resolution...');

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const hasCaptcha = await detectCaptcha(hero);
    if (!hasCaptcha) {
      logger.info('Captcha resolved!');
      return true;
    }
    await delay(2000);
  }

  logger.error('Captcha resolution timed out');
  return false;
}

/**
 * จัดการเมื่อเจอ captcha — log + รอ + retry
 * @param {import('@ulixee/hero').default} hero
 */
export async function handleCaptcha(hero) {
  const hasCaptcha = await detectCaptcha(hero);
  if (!hasCaptcha) return false;

  logger.warn('Captcha page detected — pausing scraper');

  // รอให้ captcha หาย (อาจ auto-resolve หรือต้อง manual)
  const resolved = await waitForCaptchaResolution(hero);

  if (!resolved) {
    logger.error('Could not resolve captcha, skipping this round');
    return true;
  }

  // รอเพิ่มหลัง resolve
  await delay(3000);
  return false;
}
