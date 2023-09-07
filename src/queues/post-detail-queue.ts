import { Queue } from 'bullmq';
import Database from '../database/database';
import { PostDetailJobData, PostDetailJobResult, PostIdJobData, PostIdJobResult, QueueName, getRedisConnection } from '../workers/helper';

export const postDetailQueue = new Queue<PostDetailJobData, PostDetailJobResult>(QueueName.POST_DETAIL, {
  connection: getRedisConnection()
});

export async function createCrawlPostDetailJobs(db: Database) {
  const posts = await db.getPosts();

  if (!posts.length) {
    console.log('No posts found');
    return;
  }

  await postDetailQueue.addBulk(posts.map((post) => ({
    name: post.fb_id,
    data: {
      url: post.link,
    },
    opts: {
      delay: 1000 * 20,
      removeOnComplete: 20,
      removeOnFail: 50
    },
  })));

  console.log(`Added ${posts.length} jobs of type ${QueueName.POST_DETAIL}`);
}
