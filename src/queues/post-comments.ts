import { Queue } from 'bullmq';
import { QueueName, getRedisConnection } from '../workers/helper';
import { CrawCommentlJob } from '../workers/post-comments';

export const postCommentsQueue = new Queue<CrawCommentlJob>(QueueName.POST_COMMENTS, {
  connection: getRedisConnection()
});
