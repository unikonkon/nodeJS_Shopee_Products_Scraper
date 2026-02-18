import { settings } from './config/settings.js';
import { logger } from './utils/logger.js';
import { withRetry } from './utils/retry.js';
import { scrapeShopeeProducts } from './scraper/shopee-hero.js';
import { parseAllProducts } from './parser/product-parser.js';
import { writeJson } from './storage/json-writer.js';
import { writeCsv } from './storage/csv-writer.js';

/**
 * Main entry point — orchestrate ทุกขั้นตอนของ scraping
 */
async function main() {
  const startTime = Date.now();

  logger.info('='.repeat(60));
  logger.info('Shopee Popular Products Scraper — Starting');
  logger.info(`Target: ${settings.BASE_URL}`);
  logger.info(`Max products: ${settings.MAX_PRODUCTS}`);
  logger.info('='.repeat(60));

  try {
    // Step 1: Scrape — เปิด Shopee + scroll + ดึง HTML
    logger.info('[Step 1/3] Scraping product cards from Shopee...');
    const cardsHtml = await withRetry(
      () => scrapeShopeeProducts(),
      {
        maxRetries: settings.MAX_RETRIES,
        delayMs: 10000,
        label: 'Shopee scraping',
      }
    );

    if (cardsHtml.length === 0) {
      logger.warn('No product cards found. Shopee may have changed their layout or blocked the request.');
      logger.info('Tips:');
      logger.info('  1. ตรวจสอบว่า Ulixee Cloud server รันอยู่ (npm run cloud)');
      logger.info('  2. ลองเพิ่ม MAX_SCROLL_TIMES ใน .env');
      logger.info('  3. ตรวจสอบ selectors ใน settings.js ว่ายังตรงกับ Shopee');
      return;
    }

    // Step 2: Parse — แปลง HTML → structured data
    logger.info('[Step 2/3] Parsing product data...');
    const products = parseAllProducts(cardsHtml);

    if (products.length === 0) {
      logger.warn('Found cards but could not parse any products. Selectors may need updating.');
      return;
    }

    // Step 3: Save — บันทึก JSON + CSV
    logger.info('[Step 3/3] Saving results...');
    const jsonPath = writeJson(products);
    const csvPath = writeCsv(products);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info('='.repeat(60));
    logger.info('Scraping completed!');
    logger.info(`  Products scraped: ${products.length}`);
    logger.info(`  JSON output: ${jsonPath}`);
    logger.info(`  CSV output:  ${csvPath}`);
    logger.info(`  Time elapsed: ${elapsed}s`);
    logger.info('='.repeat(60));

    // แสดงตัวอย่างสินค้า 3 ตัวแรก
    logger.info('Sample products:');
    products.slice(0, 3).forEach((p, i) => {
      logger.info(`  ${i + 1}. ${p.name} — ฿${p.price ?? 'N/A'} ${p.discount ?? ''}`);
    });
  } catch (error) {
    logger.error('Scraping failed', error.message);
    logger.error(error.stack);
    process.exitCode = 1;
  } finally {
    logger.close();
  }
}

main();
