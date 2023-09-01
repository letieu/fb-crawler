import 'dotenv/config';
import schedule from 'node-schedule';
import { startCrawlWorker } from './workers/crawl-worker';

async function main() {
  await startCrawlWorker();

  // trigger first time

  // schedule
  const crawlIdCron = process.env.CRAWL_POST_IDS_CRON || '* 0 */8 * * *';
  const crawlCommentCron = process.env.CRAWL_POST_COMMENTS_CRON || '* 0 */8 * * *';

  // schedule.scheduleJob(crawlIdCron, triggerCrawlPostIds);
  // schedule.scheduleJob(crawlCommentCron, triggerCrawlComments);
}

main();
