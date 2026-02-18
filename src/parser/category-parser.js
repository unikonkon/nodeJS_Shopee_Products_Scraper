import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

/**
 * Parse หมวดหมู่สินค้าจากหน้าแรก Shopee
 * @param {string} html - HTML ของ section หมวดหมู่
 * @returns {object[]}
 */
export function parseCategories(html) {
  const $ = cheerio.load(html);
  const categories = [];

  // Shopee แสดง categories เป็น grid ของ icons + text
  const categorySelectors = [
    '[class*="category"] a',
    '[class*="cate-list"] a',
    '.home-category-list a',
  ];

  for (const selector of categorySelectors) {
    $(selector).each((_, el) => {
      const name = $(el).text().trim();
      let url = $(el).attr('href');
      const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      if (url && !url.startsWith('http')) {
        url = `https://shopee.co.th${url}`;
      }

      if (name) {
        categories.push({ name, url, image });
      }
    });

    if (categories.length > 0) break;
  }

  logger.info(`Parsed ${categories.length} categories`);
  return categories;
}
