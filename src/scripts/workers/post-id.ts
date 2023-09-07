import 'dotenv/config';
import { startPostIdWorker } from '../../workers/post-ids-worker';

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // sleep 10s
  await startPostIdWorker();
}

main();
