import { Queue } from 'bullmq';
import { CrawlJobData, CrawlJobResult, JobType, QueueName, getRedisConnection } from '../workers/helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';

export const crawlQueue = new Queue<CrawlJobData, CrawlJobResult>(QueueName.CRAWL, {
  connection: getRedisConnection()
});

export async function triggerCrawl() {
  await crawlQueue.drain(); // reset queue

  const db = new Database(getDbConfig());
  await db.init();

  await createCrawlPostIdsJobs(db);
  await createCrawlPostDetailJobs(db);

  await db.close();
}

async function createCrawlPostIdsJobs(db: Database) {
  const groups = await db.getGroups();

  if (!groups.length) {
    console.log('No groups found');
    return;
  }

  await crawlQueue.addBulk(groups.map((group) => ({
    name: group.link,
    data: {
      type: JobType.POST_IDS,
      url: group.link,
      id: group.id,
    },
    opts: {
      delay: 1000 * 20,
    },
  })));

  console.log(`Added ${groups.length} jobs of type ${JobType.POST_IDS}`);
}

async function createCrawlPostDetailJobs(db: Database) {
  const posts = await db.getPosts();

  if (!posts.length) {
    console.log('No posts found');
    return;
  }

  await crawlQueue.addBulk(posts.map((post) => ({
    name: post.fb_id,
    data: {
      type: JobType.POST_DETAIL,
      url: post.link,
    },
    opts: {
      delay: 1000 * 20,
      removeOnComplete: 100,
      removeOnFail: 500
    },
  })));

  console.log(`Added ${posts.length} jobs of type ${JobType.POST_DETAIL}`);
}
