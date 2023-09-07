import 'dotenv/config';
import { startPostDetailWorker } from '../../workers/post-detail-worker';

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // sleep 10s
  await startPostDetailWorker();
}

main();
