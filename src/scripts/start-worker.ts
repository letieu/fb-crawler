import 'dotenv/config';
import { startCrawlWorker } from '../workers/crawl-worker';

async function main() {
  await startCrawlWorker();
  console.log('Worker started');
}

main();
