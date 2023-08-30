import { Queue } from 'bullmq';
import { QueueName, getRedisConnection } from '../workers/helper';
import { CrawCommentlJob } from '../workers/post-comments';
import { initAccountPool, accountPool, getRandomAccount } from '../account-check';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';

export const postCommentsQueue = new Queue<CrawCommentlJob>(QueueName.POST_COMMENTS, {
  connection: getRedisConnection()
});

export async function triggerCrawlComments() {
  await postCommentsQueue.drain();

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

  await postCommentsQueue.addBulk(posts.map((post) => ({
    name: post.fb_id,
    data: {
      account: getRandomAccount(),
      postUrl: post.link,
    },
    opts: {
      delay: 1000 * 20,
    },
  })));

  console.log(`Added ${posts.length} jobs to queue ${QueueName.POST_COMMENTS} \n`);
}
