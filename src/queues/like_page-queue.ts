import { Queue } from 'bullmq';
import Database from '../database/database';
import { LikePageJobData, LikePageJobResult, QueueName, getRedisConnection } from '../workers/helper';

export const likePageQueue = new Queue<LikePageJobData, LikePageJobResult>(QueueName.ADS_IDS, {
  connection: getRedisConnection()
});

export async function createCrawlLikePageJobs(db: Database) {
  await likePageQueue.drain(); // reset queue

  const accounts = await db.getAccounts();

  if (!accounts.length) {
    console.log('No groups found');
    return;
  }

  await likePageQueue.addBulk(accounts.map((account) => ({
    name: `like_page_${account.username}`,
    data: {
      account,
    },
    opts: {
      delay: 1000 * 20,
      removeOnComplete: 20,
      removeOnFail: 50
    },
  })));

  console.log(`Added ${accounts.length} jobs to queue ${QueueName.LIKE_PAGE}`);
}
