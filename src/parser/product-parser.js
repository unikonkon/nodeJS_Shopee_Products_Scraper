import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { settings } from '../config/settings.js';

/**
 * ค้นหา element ด้วย fallback selectors
 */
function findElement($, context, selectors) {
  for (const sel of selectors) {
    const el = $(context).find(sel);
    if (el.length > 0) return el;
  }
  return null;
}

/**
 * ดึงข้อความจาก element (trim whitespace)
 */
function getText($, context, selectors) {
  const el = findElement($, context, selectors);
  return el ? el.first().text().trim() : null;
}

/**
 * Parse ราคาจาก text → number
 * รองรับรูปแบบ: "฿199", "199.00", "฿1,299"
 */
function parsePrice(priceText) {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse rating จาก text → number
 */
function parseRating(ratingText) {
  if (!ratingText) return null;
  const match = ratingText.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * ตรวจสอบว่า element มี badge หรือไม่
 */
function hasBadge($, context, selectors) {
  for (const sel of selectors) {
    if ($(context).find(sel).length > 0) return true;
  }
  return false;
}

/**
 * Parse product card HTML เดียว → structured data
 * @param {string} cardHtml - outerHTML ของ product card
 * @param {string|null} href - link ของ card
 * @returns {object|null}
 */
export function parseProductCard(cardHtml, href = null) {
  try {
    const $ = cheerio.load(cardHtml);
    const card = $.root().children().first();

    // Product name
    let name = getText($, card, settings.SELECTORS.PRODUCT_NAME);
    if (!name) {
      // Fallback: ดึง text จาก title attribute หรือ aria-label
      name = card.attr('title') || card.find('[title]').first().attr('title');
    }
    if (!name) {
      // Fallback: ดึง alt text จาก image
      name = card.find('img').first().attr('alt');
    }

    // ถ้าไม่มีชื่อสินค้าเลย ข้ามไป
    if (!name || name.trim().length === 0) {
      return null;
    }

    // Prices — ดึง text ทั้งหมดจาก price area
    const priceElements = [];
    for (const sel of settings.SELECTORS.PRODUCT_PRICE) {
      card.find(sel).each((_, el) => {
        priceElements.push($(el).text().trim());
      });
      if (priceElements.length > 0) break;
    }

    let price = null;
    let originalPrice = null;

    if (priceElements.length >= 2) {
      // สมมุติว่า element แรกเป็นราคาปัจจุบัน ตัวหลังเป็นราคาเดิม
      price = parsePrice(priceElements[0]);
      originalPrice = parsePrice(priceElements[1]);
    } else if (priceElements.length === 1) {
      price = parsePrice(priceElements[0]);
    }

    // ดึงราคาจาก range เช่น "฿100 - ฿200"
    if (price === null) {
      const allPriceText = card.text();
      const priceMatch = allPriceText.match(/฿([\d,.]+)/);
      if (priceMatch) {
        price = parsePrice(priceMatch[1]);
      }
    }

    // Discount
    const discount = getText($, card, settings.SELECTORS.PRODUCT_DISCOUNT);

    // Sold count
    const sold = getText($, card, settings.SELECTORS.PRODUCT_SOLD);

    // Rating
    const ratingText = card.find('[class*="rating"]').first().text().trim();
    const rating = parseRating(ratingText);

    // Image
    let image = null;
    const imgEl = card.find('img').first();
    if (imgEl.length) {
      image = imgEl.attr('src') || imgEl.attr('data-src') || null;
      // Fix relative URLs
      if (image && !image.startsWith('http')) {
        image = `https:${image}`;
      }
    }

    // Product URL
    let productUrl = href || card.attr('href') || card.find('a').first().attr('href') || null;
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `${settings.BASE_URL}${productUrl}`;
    }

    // Shop name
    const shopName = getText($, card, ['[class*="shop-name"]', '[class*="shopName"]', '[data-sqe="shopName"]']);

    // Shop location
    const shopLocation = getText($, card, settings.SELECTORS.PRODUCT_LOCATION);

    // Badges
    const isMall = hasBadge($, card, settings.SELECTORS.MALL_BADGE);
    const isPreferred = hasBadge($, card, settings.SELECTORS.PREFERRED_BADGE);
    const freeShipping = hasBadge($, card, settings.SELECTORS.FREE_SHIPPING_BADGE);

    return {
      name: name.trim(),
      price,
      originalPrice,
      discount,
      sold,
      rating,
      image,
      productUrl,
      shopName,
      shopLocation,
      isMall,
      isPreferred,
      freeShipping,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.debug('Failed to parse product card', err.message);
    return null;
  }
}

/**
 * Parse product cards ทั้งหมด
 * @param {Array<{html: string, href: string|null}>} cardsData
 * @returns {object[]}
 */
export function parseAllProducts(cardsData) {
  const products = [];

  for (const { html, href } of cardsData) {
    const product = parseProductCard(html, href);
    if (product) {
      products.push(product);
    }
  }

  logger.info(`Parsed ${products.length} products from ${cardsData.length} cards`);
  return products;
}
