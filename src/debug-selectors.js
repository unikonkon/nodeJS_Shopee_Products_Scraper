import Hero from '@ulixee/hero';
import { settings } from './config/settings.js';
import { logger } from './utils/logger.js';
import { randomDelay, delay } from './utils/delay.js';
import fs from 'fs';

/**
 * Debug script — ดึง HTML จาก Shopee เพื่อวิเคราะห์ selectors ที่ถูกต้อง
 */
async function debugSelectors() {
  const hero = new Hero({
    connectionToCore: `ws://localhost:${settings.HERO_CLOUD_PORT}`,
    viewport: settings.VIEWPORT,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    blockedResourceTypes: ['Media'],
  });

  try {
    logger.info('Navigating to Shopee...');
    await hero.goto(settings.BASE_URL, { timeoutMs: settings.PAGE_LOAD_TIMEOUT });
    await hero.waitForPaintingStable({ timeoutMs: 10000 });
    logger.info('Page loaded');

    // ปิด popup
    await delay(3000);
    for (const sel of settings.SELECTORS.POPUP_CLOSE) {
      try {
        const btn = hero.document.querySelector(sel);
        if (btn && (await btn.$isVisible)) {
          await hero.click(btn);
          logger.info(`Closed popup: ${sel}`);
          await delay(500);
        }
      } catch {}
    }

    // Scroll ลงเพื่อ load content
    logger.info('Scrolling down to load products...');
    for (let i = 0; i < 8; i++) {
      await hero.getJsValue(`window.scrollBy(0, ${settings.VIEWPORT.height})`);
      await randomDelay(2000, 3000);
      try { await hero.waitForPaintingStable({ timeoutMs: 5000 }); } catch {}
      logger.info(`Scroll #${i + 1} done`);
    }

    // บันทึก full page HTML
    logger.info('Extracting page HTML...');
    const fullHtml = await hero.getJsValue('document.documentElement.outerHTML');
    fs.writeFileSync('./output/debug-page.html', fullHtml, 'utf-8');
    logger.info('Saved full page HTML → output/debug-page.html');

    // ค้นหา elements ที่น่าจะเป็น product cards
    logger.info('\n--- Searching for potential product elements ---\n');

    const queries = [
      // data attributes
      'document.querySelectorAll("[data-sqe]").length',
      'Array.from(document.querySelectorAll("[data-sqe]")).map(e => e.getAttribute("data-sqe")).filter((v,i,a) => a.indexOf(v) === i)',

      // Common product patterns
      'document.querySelectorAll("a[href*=\\"-i.\\"]").length',
      'document.querySelectorAll("a[href*=\\"/product/\\"]").length',
      'document.querySelectorAll("a[href*=\\"shopee.co.th\\"]").length',

      // Shopee specific
      'document.querySelectorAll(".shopee-search-item-result__item").length',
      'document.querySelectorAll("[class*=\\"product\\"]").length',
      'document.querySelectorAll("[class*=\\"card\\"]").length',
      'document.querySelectorAll("[class*=\\"item\\"]").length',
      'document.querySelectorAll("[class*=\\"grid\\"]").length',

      // Link patterns for products (Shopee product URLs contain "-i." pattern)
      'Array.from(document.querySelectorAll("a")).filter(a => a.href && a.href.includes("-i.")).length',
      'Array.from(document.querySelectorAll("a")).filter(a => a.href && a.href.includes("-i."))[0]?.outerHTML?.substring(0, 300)',

      // Section structure
      'document.querySelectorAll("section").length',
      'Array.from(document.querySelectorAll("section")).map(s => ({tag: s.tagName, classes: s.className?.substring(0,80), children: s.children.length}))',

      // Main content area
      'document.querySelectorAll("main").length',
      'document.querySelector("main")?.children?.length',
      'Array.from(document.querySelector("main")?.children || []).map(c => ({tag: c.tagName, cls: c.className?.substring(0,60), kids: c.children.length}))',
    ];

    for (const q of queries) {
      try {
        const result = await hero.getJsValue(q);
        logger.info(`${q}\n  → ${JSON.stringify(result)}\n`);
      } catch (err) {
        logger.debug(`${q} → ERROR: ${err.message}`);
      }
    }

    // ดึง sample ของ links ที่มี "-i." (รูปแบบ URL สินค้า Shopee)
    logger.info('\n--- Sample product links ---\n');
    const productLinks = await hero.getJsValue(`
      Array.from(document.querySelectorAll("a"))
        .filter(a => a.href && a.href.includes("-i."))
        .slice(0, 5)
        .map(a => ({
          href: a.href,
          text: a.textContent?.substring(0, 100)?.trim(),
          classes: a.className?.substring(0, 80),
          parentClasses: a.parentElement?.className?.substring(0, 80),
          childTags: Array.from(a.children).map(c => c.tagName + '.' + (c.className?.substring(0,30) || '')).join(', '),
          innerHTML: a.innerHTML?.substring(0, 500),
        }))
    `);
    for (const link of productLinks || []) {
      logger.info(JSON.stringify(link, null, 2));
    }

    // ดึง parent containers ของ product links
    if (productLinks && productLinks.length > 0) {
      logger.info('\n--- Product card parent structure ---\n');
      const parentInfo = await hero.getJsValue(`
        (() => {
          const links = Array.from(document.querySelectorAll("a")).filter(a => a.href && a.href.includes("-i."));
          if (links.length === 0) return null;
          const first = links[0];
          const parents = [];
          let el = first;
          for (let i = 0; i < 5; i++) {
            el = el.parentElement;
            if (!el) break;
            parents.push({
              tag: el.tagName,
              classes: el.className?.substring(0, 100),
              childCount: el.children.length,
              id: el.id || null,
            });
          }
          return { totalLinks: links.length, parents };
        })()
      `);
      logger.info(JSON.stringify(parentInfo, null, 2));
    }

  } finally {
    await hero.close();
    logger.info('Done. Check output/debug-page.html and logs for selector analysis.');
    logger.close();
  }
}

debugSelectors().catch(err => {
  logger.error('Debug failed', err.message);
  logger.close();
  process.exit(1);
});
