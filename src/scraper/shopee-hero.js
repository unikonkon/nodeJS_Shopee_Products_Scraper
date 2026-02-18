import Hero from '@ulixee/hero';
import { settings } from '../config/settings.js';
import { logger } from '../utils/logger.js';
import { randomDelay, delay } from '../utils/delay.js';
import { handleCaptcha } from './captcha-handler.js';
import { scrollToLoadProducts } from './scroll-handler.js';

/**
 * สร้าง Hero instance ที่ config สำหรับ Shopee
 */
export function createHero() {
  const hero = new Hero({
    connectionToCore: `ws://localhost:${settings.HERO_CLOUD_PORT}`,
    viewport: settings.VIEWPORT,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    blockedResourceTypes: ['Media'], // block video/audio เพื่อเร็วขึ้น
    userProfile: undefined, // ใช้ clean profile ทุกครั้ง
  });

  return hero;
}

/**
 * ปิด popup โปรโมชันที่ Shopee แสดงเมื่อเข้าครั้งแรก
 */
async function closePopups(hero) {
  logger.info('Checking for popups...');
  await delay(2000); // รอให้ popup แสดง

  for (const selector of settings.SELECTORS.POPUP_CLOSE) {
    try {
      const closeBtn = hero.document.querySelector(selector);
      if (closeBtn && (await closeBtn.$isVisible)) {
        await hero.click(closeBtn);
        logger.info(`Closed popup using selector: ${selector}`);
        await delay(500);
      }
    } catch {
      // ไม่เจอ popup — ปกติ
    }
  }
}

/**
 * ดึง HTML ของ product cards ทั้งหมดที่ปรากฏบนหน้า
 * @param {import('@ulixee/hero').default} hero
 * @returns {string[]} array ของ outerHTML แต่ละ product card
 */
async function extractProductCardsHtml(hero) {
  const cardsHtml = [];

  // ลอง selector ของ product card ทีละตัว
  for (const cardSelector of settings.SELECTORS.PRODUCT_CARD) {
    try {
      const cards = hero.document.querySelectorAll(cardSelector);
      const length = await cards.length;

      if (length > 0) {
        logger.info(`Found ${length} product cards with selector: ${cardSelector}`);

        for (let i = 0; i < length; i++) {
          try {
            const card = cards[i];
            const html = await card.outerHTML;
            const href = await card.getAttribute('href').catch(() => null);
            cardsHtml.push({ html, href });
          } catch (err) {
            logger.debug(`Failed to extract card #${i}`, err.message);
          }
        }

        if (cardsHtml.length > 0) break; // เจอแล้ว ไม่ต้องลอง selector อื่น
      }
    } catch {
      // selector นี้ไม่ match — ลองตัวถัดไป
    }
  }

  return cardsHtml;
}

/**
 * กดปุ่ม "ดูเพิ่มเติม" / "See More" ถ้ามี
 */
async function clickLoadMore(hero) {
  for (const selector of settings.SELECTORS.LOAD_MORE_BUTTON) {
    try {
      const btn = hero.document.querySelector(selector);
      if (btn && (await btn.$isVisible)) {
        await hero.click(btn);
        logger.info(`Clicked load more button: ${selector}`);
        await delay(2000);
        return true;
      }
    } catch {
      // ไม่เจอปุ่ม
    }
  }
  return false;
}

/**
 * Main scraping flow — เปิด Shopee + scroll + ดึงข้อมูล
 * @returns {string[]} array ของ product card HTML
 */
export async function scrapeShopeeProducts() {
  const hero = createHero();
  let allCardsHtml = [];

  try {
    logger.info(`Navigating to ${settings.BASE_URL}...`);
    await hero.goto(settings.BASE_URL, {
      timeoutMs: settings.PAGE_LOAD_TIMEOUT,
    });

    // รอหน้า load สมบูรณ์
    await hero.waitForPaintingStable({ timeoutMs: 10000 });
    logger.info('Page loaded successfully');

    // ตรวจจับ captcha
    const blocked = await handleCaptcha(hero);
    if (blocked) {
      throw new Error('Blocked by captcha, cannot continue');
    }

    // ปิด popup
    await closePopups(hero);
    await randomDelay(1000, 2000);

    // Scroll เพื่อ load สินค้า
    await scrollToLoadProducts(hero, {
      maxScrolls: settings.MAX_SCROLL_TIMES,
    });

    // รอให้ content settle
    await delay(2000);

    // ดึง HTML ของ product cards
    allCardsHtml = await extractProductCardsHtml(hero);
    logger.info(`Extracted ${allCardsHtml.length} raw product cards`);

    // กดปุ่ม Load More ถ้ามี แล้ว scroll อีกรอบ
    if (allCardsHtml.length < settings.MAX_PRODUCTS) {
      const hasMore = await clickLoadMore(hero);
      if (hasMore) {
        await scrollToLoadProducts(hero, { maxScrolls: 5 });
        const moreCards = await extractProductCardsHtml(hero);
        // เพิ่มเฉพาะ cards ใหม่ที่ยังไม่มี
        const existingHrefs = new Set(allCardsHtml.map(c => c.href));
        for (const card of moreCards) {
          if (!existingHrefs.has(card.href)) {
            allCardsHtml.push(card);
          }
        }
        logger.info(`Total product cards after load more: ${allCardsHtml.length}`);
      }
    }

    // จำกัดจำนวน
    if (allCardsHtml.length > settings.MAX_PRODUCTS) {
      allCardsHtml = allCardsHtml.slice(0, settings.MAX_PRODUCTS);
    }
  } finally {
    await hero.close();
    logger.info('Hero browser closed');
  }

  return allCardsHtml;
}
