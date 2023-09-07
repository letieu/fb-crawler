import 'dotenv/config';
import { startPostIdWorker } from '../../workers/post-ids-worker';

async function main() {
  await startPostIdWorker();
}

main();
