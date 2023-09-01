import { Queue } from 'bullmq';
import { CrawlJobData, CrawlJobResult, QueueName, getRedisConnection } from '../workers/helper';
import { initAccountPool, accountPool, getRandomAccount } from '../account-check';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';

export const crawlQueue = new Queue<CrawlJobData, CrawlJobResult>(QueueName.CRAWL, {
  connection: getRedisConnection()
});

export async function triggerCrawl() {
  await crawlQueue.drain();

  const db = new Database(getDbConfig());
  await db.init();
  await initAccountPool(db);

  const posts = await db.getPosts();

  if (!posts.length) {
    console.log('No posts found');
    return;
  }

  if (!accountPool.length) {
    console.log('No account found');
    return;
  }

  // await postCommentsQueue.addBulk(posts.map((post) => ({
  //   name: post.fb_id,
  //   data: {
  //     account: getRandomAccount(),
  //     postUrl: post.link,
  //   },
  //   opts: {
  //     delay: 1000 * 20,
  //   },
  // })));
  //
  // console.log(`Added ${posts.length} jobs to queue ${QueueName.POST_COMMENTS} \n`);
}
