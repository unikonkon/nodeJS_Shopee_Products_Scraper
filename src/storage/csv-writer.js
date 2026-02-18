import fs from 'fs';
import path from 'path';
import { settings } from '../config/settings.js';
import { logger } from '../utils/logger.js';

/**
 * Escape ค่าสำหรับ CSV (รองรับ comma, quotes, newlines)
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * บันทึกข้อมูลเป็น CSV file
 * @param {object[]} data - array ของ product objects
 * @param {string} filename - ชื่อไฟล์ (default: products.csv)
 */
export function writeCsv(data, filename = 'products.csv') {
  if (data.length === 0) {
    logger.warn('No data to write CSV');
    return null;
  }

  const outputDir = settings.OUTPUT_DIR;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);

  // Header from first object keys
  const headers = Object.keys(data[0]);
  const headerLine = headers.map(escapeCsvValue).join(',');

  // Rows
  const rows = data.map(item =>
    headers.map(h => escapeCsvValue(item[h])).join(',')
  );

  const csvContent = [headerLine, ...rows].join('\n');

  // เขียนด้วย BOM สำหรับรองรับภาษาไทยใน Excel
  const bom = '\uFEFF';
  fs.writeFileSync(filePath, bom + csvContent, 'utf-8');
  logger.info(`CSV saved: ${filePath} (${data.length} products)`);

  return filePath;
}
