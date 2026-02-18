import fs from 'fs';
import path from 'path';
import { settings } from '../config/settings.js';

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LOG_DIR = settings.LOG_DIR;

// สร้าง log directory ถ้ายังไม่มี
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFilePath = path.join(LOG_DIR, 'scraper.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  let line = `[${timestamp}] [${level}] ${message}`;
  if (data !== undefined) {
    line += ` ${typeof data === 'object' ? JSON.stringify(data) : data}`;
  }
  return line;
}

function log(level, message, data) {
  const line = formatMessage(level, message, data);
  logStream.write(line + '\n');

  // แสดงใน console ด้วย
  const colors = {
    DEBUG: '\x1b[90m',
    INFO: '\x1b[36m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level] || ''}${line}${reset}`);
}

export const logger = {
  debug: (msg, data) => log('DEBUG', msg, data),
  info: (msg, data) => log('INFO', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  close: () => logStream.end(),
};
