import { Queue } from 'bullmq';
import Database from '../database/database';
import { PostIdJobData, PostIdJobResult, QueueName, getRedisConnection } from '../workers/helper';

export const postIdQueue = new Queue<PostIdJobData, PostIdJobResult>(QueueName.POST_IDS, {
  connection: getRedisConnection()
});

export async function createCrawlPostIdsJobs(db: Database) {
  await postIdQueue.drain(); // reset queue

  const groups = await db.getGroups();

  if (!groups.length) {
    console.log('No groups found');
    return;
  }

  await postIdQueue.addBulk(groups.map((group) => ({
    name: group.link,
    data: {
      url: group.link,
      id: group.id,
    },
    opts: {
      delay: 1000 * 20,
      removeOnComplete: 20,
      removeOnFail: 50
    },
  })));

  console.log(`Added ${groups.length} jobs to queue ${QueueName.POST_IDS}`);
}
