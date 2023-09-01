import 'dotenv/config';
import { triggerCrawl } from "../queues/crawl-queue";

async function main() {
  await triggerCrawl();
  process.exit(0);
}

main();
