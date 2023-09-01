import 'dotenv/config';
import schedule from 'node-schedule';
import { triggerCrawl } from '../queues/crawl-queue';

async function main() {
  // schedule
  const crawlIdCron = process.env.CRAWL_POST_IDS_CRON || '* 0 */8 * * *';
  const crawlCommentCron = process.env.CRAWL_POST_COMMENTS_CRON || '* 0 */8 * * *';

  schedule.scheduleJob(crawlIdCron, async () => {
    await triggerCrawl();
    console.log('Trigger crawl by schedule');
  });
}

main();
