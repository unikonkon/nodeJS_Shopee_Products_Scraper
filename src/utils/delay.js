/**
 * สร้าง random delay เพื่อจำลองพฤติกรรมมนุษย์
 */
export function randomDelay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delay คงที่
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
