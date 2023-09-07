import 'dotenv/config';
import { startPostDetailWorker } from '../../workers/post-detail-worker';

async function main() {
  await startPostDetailWorker();
}

main();
