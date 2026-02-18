import 'dotenv/config';

export const settings = {
  BASE_URL: process.env.BASE_URL || 'https://shopee.co.th',
  HERO_CLOUD_PORT: parseInt(process.env.HERO_CLOUD_PORT || '1818', 10),

  // Scroll behavior
  MAX_SCROLL_TIMES: parseInt(process.env.MAX_SCROLL_TIMES || '15', 10),
  SCROLL_DELAY_MIN: parseInt(process.env.SCROLL_DELAY_MIN || '1500', 10),
  SCROLL_DELAY_MAX: parseInt(process.env.SCROLL_DELAY_MAX || '3000', 10),

  // Timeouts
  PAGE_LOAD_TIMEOUT: parseInt(process.env.PAGE_LOAD_TIMEOUT || '30000', 10),

  // Limits
  MAX_PRODUCTS: parseInt(process.env.MAX_PRODUCTS || '100', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),

  // Output
  OUTPUT_DIR: process.env.OUTPUT_DIR || './output',
  LOG_DIR: process.env.LOG_DIR || './logs',

  // Hero browser settings
  VIEWPORT: { width: 1920, height: 1080 },

  // Selectors — ใช้ structural selectors เพราะ Shopee เปลี่ยน class hash บ่อย
  SELECTORS: {
    // Popup / Modal ปิดโปรโมชัน
    POPUP_CLOSE: [
      '.shopee-popup__close-btn',
      '[class*="popup"] [class*="close"]',
      '.home-popup__close-btn',
      'div[role="dialog"] button',
    ],

    // Product card containers — ใช้หลาย fallback
    PRODUCT_GRID: [
      '.stardust-tabs-panels__panel .row.shopee-search-item-result__items',
      '[class*="product-list"]',
      'div[data-sqe="item"]',
      '.shopee-search-item-result__items',
    ],

    PRODUCT_CARD: [
      'a[data-sqe="link"]',
      '.shopee-search-item-result__item',
      '[class*="product-card"]',
      'div[data-sqe="item"] a',
    ],

    // Product fields
    PRODUCT_NAME: [
      '[data-sqe="name"]',
      'div[class*="product-name"]',
      '.ie3A\\+n.bM\\+7UW',
    ],
    PRODUCT_PRICE: [
      '[class*="price"]',
      'span[class*="price"]',
    ],
    PRODUCT_IMAGE: [
      'img[class*="product"]',
      'img',
    ],
    PRODUCT_SOLD: [
      '[class*="sold"]',
      'span[class*="sold"]',
    ],
    PRODUCT_DISCOUNT: [
      '[class*="discount"]',
      'span[class*="percent"]',
    ],
    PRODUCT_LOCATION: [
      '[class*="location"]',
      'span[class*="location"]',
    ],

    // Badges
    MALL_BADGE: [
      '[class*="official-shop"]',
      'img[alt*="Mall"]',
      '[class*="mall"]',
    ],
    PREFERRED_BADGE: [
      '[class*="preferred"]',
      'img[alt*="Preferred"]',
    ],
    FREE_SHIPPING_BADGE: [
      '[class*="free-shipping"]',
      'img[alt*="Free"]',
      '[class*="freeShipping"]',
    ],

    // Load more / pagination
    LOAD_MORE_BUTTON: [
      'button[class*="see-more"]',
      'button[class*="load-more"]',
    ],

    // Captcha detection
    CAPTCHA: [
      '#captcha',
      '[class*="captcha"]',
      'iframe[src*="captcha"]',
      '.verify-wrap',
    ],
  },
};
