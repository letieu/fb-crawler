import { Queue } from 'bullmq';
import { CrawPostIdslJob } from '../workers/group-post-ids';
import { QueueName, getRedisConnection } from '../workers/helper';

export const groupPostIdsQueue = new Queue<CrawPostIdslJob>(QueueName.GROUP_POST_IDS, {
  connection: getRedisConnection()
});
