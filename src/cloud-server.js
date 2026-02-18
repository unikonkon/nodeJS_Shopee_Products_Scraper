import { CloudNode } from '@ulixee/cloud';
import { settings } from './config/settings.js';
import { logger } from './utils/logger.js';

/**
 * เริ่มต้น Ulixee Cloud Server
 * รันแยกเป็น process: npm run cloud
 */
async function startCloud() {
  const cloud = new CloudNode({
    port: settings.HERO_CLOUD_PORT,
  });

  await cloud.listen();
  logger.info(`Ulixee Cloud server started on port ${cloud.port}`);
  logger.info('Press Ctrl+C to stop');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down Cloud server...');
    await cloud.close();
    logger.close();
    process.exit(0);
  });
}

startCloud().catch(err => {
  logger.error('Failed to start Cloud server', err.message);
  process.exit(1);
});
