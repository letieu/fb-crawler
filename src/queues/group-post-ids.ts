import { Queue } from 'bullmq';
import { CrawPostIdslJob } from '../workers/group-post-ids';
import { getRedisConnection } from '../workers/helper';

export const groupPostIdsQueue = new Queue<CrawPostIdslJob>('GroupPostIds', {
  connection: getRedisConnection()
});
