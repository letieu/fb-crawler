import 'dotenv/config';
import { startAdsIdWorker } from '../../workers/ads-ids-worker';

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 20 * 1000)); // sleep 20s
  await startAdsIdWorker();
}

main();
