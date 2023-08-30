import { Queue } from 'bullmq';
import { CrawPostIdslJob } from '../workers/group-post-ids';
import { QueueName, getRedisConnection } from '../workers/helper';
import { initAccountPool, accountPool, getRandomAccount } from '../account-check';
import { getGroupIdFromUrl } from '../crawlers/helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';

export const groupPostIdsQueue = new Queue<CrawPostIdslJob>(QueueName.GROUP_POST_IDS, {
  connection: getRedisConnection(),
});

export async function triggerCrawlPostIds() {
  await groupPostIdsQueue.drain();

  const db = new Database(getDbConfig());
  await db.init();
  await initAccountPool(db);

  const groups = await db.getGroups();

  if (!groups.length) {
    console.log('No groups found');
    return;
  }

  if (!accountPool.length) {
    console.log('No account found');
    return;
  }

  await groupPostIdsQueue.addBulk(groups.map((group) => ({
    name: group.link,
    data: {
      account: getRandomAccount(),
      groupId: getGroupIdFromUrl(group.link),
    },
    opts: {
      delay: 1000 * 3,
      timeout: 1000 * 60 * 50, // 50 minutes
    },
  })));

  console.log(`Added ${groups.length} jobs to queue ${QueueName.GROUP_POST_IDS} \n`);
}
