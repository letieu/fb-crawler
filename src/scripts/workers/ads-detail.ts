import 'dotenv/config';
import { } from '../../workers/post-detail-worker';
import { startAdsDetailWorker } from '../../workers/ads-detail-worker';

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // sleep 10s
  await startAdsDetailWorker();
}

main();
