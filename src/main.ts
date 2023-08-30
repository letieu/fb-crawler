import 'dotenv/config';
import { triggerCrawlComments } from './queues/post-comments';
import { startPostCommentWorker } from './workers/post-comments';
import { triggerCrawlPostIds } from './queues/group-post-ids';
import { startPostIdWorker } from './workers/group-post-ids';
import schedule from 'node-schedule';

async function main() {
  // trigger first time
  await triggerCrawlComments();
  await startPostCommentWorker();

  await triggerCrawlPostIds();
  await startPostIdWorker();

  // schedule
  const crawlIdCron = process.env.CRAWL_POST_IDS_CRON || '* 0 */8 * * *';
  const crawlCommentCron = process.env.CRAWL_POST_COMMENTS_CRON || '* 0 */8 * * *';

  schedule.scheduleJob(crawlIdCron, triggerCrawlPostIds);
  schedule.scheduleJob(crawlCommentCron, triggerCrawlComments);
}

main();
