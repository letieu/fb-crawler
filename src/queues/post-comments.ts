import { Queue } from 'bullmq';
import { getRedisConnection } from '../workers/helper';
import { CrawCommentlJob } from '../workers/post-comments';

export const postCommentsQueue = new Queue<CrawCommentlJob>('PostComments', {
  connection: getRedisConnection()
});
