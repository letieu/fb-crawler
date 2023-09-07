import 'dotenv/config';
import { startPostIdWorker } from '../../workers/post-ids-worker';

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 20 * 1000)); // sleep 20s
  await startPostIdWorker();
}

main();
