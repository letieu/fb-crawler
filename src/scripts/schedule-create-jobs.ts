import 'dotenv/config';
import { triggerCrawl } from '../queues/crawl-queue';
import { CronJob } from 'cron';

const cronTime = process.env.CRAWL_CRON || '* 0 */8 * * *';

const job = new CronJob(
  cronTime,
  async () => {
    await triggerCrawl();
    console.log('triggerCrawl from cron');
  },
  null, // onComplete
  false,
  'Asia/Ho_Chi_Minh',
  null, // context
  true, // runOnInit
);

async function main() {
  job.start();
  console.log(`Crawl cron: ${cronTime} started`);
}

main();
