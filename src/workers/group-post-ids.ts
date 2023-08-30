import 'dotenv/config';
import { QueueEvents, WaitingChildrenError, Worker } from 'bullmq';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { QueueName, getRedisConnection } from './helper';
import { Account } from '../crawlers/helper';
import { postCommentsQueue } from '../queues/post-comments';
import { checkAccount } from '../account-check';

const limit = parseInt(process.env.POST_IDS_LIMIT || '20');

export type CrawPostIdslJob = {
  groupId: string;
  account: Account;
}

const queueEvents = new QueueEvents(QueueName.POST_COMMENTS, {
  connection: getRedisConnection(),
});

export async function startGroupPostIds() {
  const worker = new Worker<CrawPostIdslJob, any>(
    QueueName.GROUP_POST_IDS,

    async (job, token) => {
      const { groupId, account } = job.data;

      console.log(`Start crawling post ids for group ${groupId} \n`);

      const crawler = new PostIdsCrawler(groupId, account);
      crawler.setLimit(limit);

      const postLinks = await crawler.start();

      if (!postLinks) {
        throw new Error('Cannot crawl post ids');
      }

      console.log(`Crawled ${postLinks.length} post ids`);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const childJobs = await postCommentsQueue.addBulk(
        postLinks
          .filter((link) => link)
          .map((link) => ({
            name: link,
            data: {
              account: account,
              postUrl: link,
            },
          }))
      );

      // wait for all child jobs to complete
      try {
        await Promise.all(childJobs.map((job) => job.waitUntilFinished(queueEvents)));
      } catch (err) {
        if (err instanceof WaitingChildrenError) {
          console.log('Waiting for child jobs to complete');
        } else {
          throw err;
        }
      }

      return postLinks;
    },

    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on('completed', async (job) => {
    const result = job.returnvalue;

    if (result) {
      console.log(`Crawled ${result.length} post ids`);
    }
  });

  worker.on('failed', (job, err) => {
    const account = job.data.account;

    console.log(`Job ${job.id} failed with error ${err}`);

    checkAccount(account);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  console.log('Worker started for GroupPostIds');
  return worker;
}
