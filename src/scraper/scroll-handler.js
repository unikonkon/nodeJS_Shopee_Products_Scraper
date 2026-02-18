import { logger } from '../utils/logger.js';
import { settings } from '../config/settings.js';
import { randomDelay } from '../utils/delay.js';

/**
 * เลื่อนหน้าลงเพื่อ trigger lazy loading ของ product cards
 * จำลองพฤติกรรมมนุษย์ด้วย random delay
 * @param {import('@ulixee/hero').default} hero
 * @param {object} options
 * @param {number} options.maxScrolls - จำนวน scroll สูงสุด
 * @param {Function} options.onNewContent - callback เมื่อเจอ content ใหม่
 * @returns {number} จำนวนครั้งที่ scroll
 */
export async function scrollToLoadProducts(hero, options = {}) {
  const {
    maxScrolls = settings.MAX_SCROLL_TIMES,
    onNewContent = null,
  } = options;

  let scrollCount = 0;
  let previousHeight = 0;
  let noChangeCount = 0;

  logger.info(`Starting scroll (max ${maxScrolls} times)...`);

  for (let i = 0; i < maxScrolls; i++) {
    // ดึง scroll height ปัจจุบัน
    const currentHeight = await hero.getJsValue('document.body.scrollHeight');

    // Scroll ลง 1 viewport height + random offset
    const scrollAmount = settings.VIEWPORT.height + Math.floor(Math.random() * 200) - 100;
    await hero.getJsValue(`window.scrollBy(0, ${scrollAmount})`);
    scrollCount++;

    logger.debug(`Scroll #${scrollCount}: scrolled ${scrollAmount}px`);

    // รอ content load
    await randomDelay(settings.SCROLL_DELAY_MIN, settings.SCROLL_DELAY_MAX);

    // รอ painting stable
    try {
      await hero.waitForPaintingStable({ timeoutMs: 5000 });
    } catch {
      // timeout ไม่เป็นไร — อาจไม่มี content ใหม่
    }

    // เช็คว่า page height เพิ่มขึ้นหรือไม่
    const newHeight = await hero.getJsValue('document.body.scrollHeight');
    if (newHeight === previousHeight) {
      noChangeCount++;
      logger.debug(`No new content after scroll #${scrollCount} (${noChangeCount} consecutive)`);
      if (noChangeCount >= 3) {
        logger.info('No more content to load, stopping scroll');
        break;
      }
    } else {
      noChangeCount = 0;
    }
    previousHeight = newHeight;

    // Callback สำหรับ process content ระหว่าง scroll
    if (onNewContent) {
      await onNewContent(scrollCount);
    }
  }

  logger.info(`Scroll completed: ${scrollCount} scrolls`);
  return scrollCount;
}

/**
 * Scroll ไปที่ element เฉพาะ
 * @param {import('@ulixee/hero').default} hero
 * @param {string} selector
 */
export async function scrollToElement(hero, selector) {
  try {
    await hero.getJsValue(
      `document.querySelector('${selector}')?.scrollIntoView({ behavior: 'smooth', block: 'center' })`
    );
    await randomDelay(800, 1500);
    return true;
  } catch (err) {
    logger.warn(`Could not scroll to element: ${selector}`, err.message);
    return false;
  }
}
