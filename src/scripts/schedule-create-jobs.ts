import 'dotenv/config';
import { triggerCrawl } from '../queues/crawl-queue';
import { CronJob } from 'cron';

async function main() {
  const cronTime = process.env.CRAWL_CRON || '* 0 */8 * * *';

  const job = new CronJob(
    cronTime,
    async () => {
      await triggerCrawl();
      console.log(`Trigger crawl by schedule at ${new Date()}`);
    },
    null,
    true,
  );

  job.start();

  console.log(`Crawl cron: ${cronTime} started`);
}

main();
