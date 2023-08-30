import 'dotenv/config';
import { Worker } from 'bullmq';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { QueueName, getRedisConnection } from './helper';
import { Account } from '../crawlers/helper';
import { checkAccount } from '../account-check';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';

const limit = parseInt(process.env.POST_IDS_LIMIT || '20');

export type CrawPostIdslJob = {
  groupId: string;
  account: Account;
}

export async function startPostIdWorker() {
  const db = new Database(getDbConfig());
  await db.init();

  const worker = new Worker<CrawPostIdslJob, any>(
    QueueName.GROUP_POST_IDS,

    async (job) => {
      const { groupId, account } = job.data;

      console.log(`Start crawling post ids for group ${groupId} \n`);

      const crawler = new PostIdsCrawler(groupId, account);
      crawler.setLimit(limit);

      const postLinks = await crawler.start();
      if (!postLinks) {
        throw new Error('No post links found');
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
      await db.savePostLinks(result)
    }
  });

  worker.on('failed', (job, err) => {
    const account = job.data.account;

    console.error(err);

    checkAccount(account);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  console.log('Worker started for GroupPostIds');
  return worker;
}
