import fs from 'fs';
import path from 'path';
import { settings } from '../config/settings.js';
import { logger } from '../utils/logger.js';

/**
 * บันทึกข้อมูลเป็น JSON file
 * @param {object[]} data - array ของ product objects
 * @param {string} filename - ชื่อไฟล์ (default: products.json)
 */
export function writeJson(data, filename = 'products.json') {
  const outputDir = settings.OUTPUT_DIR;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  const output = {
    metadata: {
      source: settings.BASE_URL,
      scrapedAt: new Date().toISOString(),
      totalProducts: data.length,
    },
    products: data,
  };

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
  logger.info(`JSON saved: ${filePath} (${data.length} products)`);

  return filePath;
}
