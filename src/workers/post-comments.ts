import 'dotenv/config';
import { Worker } from 'bullmq';
import { Account } from "../crawlers/helper";
import { QueueName, getRedisConnection } from './helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostCommentCrawler } from '../crawlers/post-comments-crawler';
import { checkAccount } from '../account-check';

const limit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');
console.log(`Post comments limit: ${limit}`);

export type CrawCommentlJob = {
  postUrl: string;
  account: Account;
}

export async function startPostComments() {
  const db = new Database(getDbConfig());
  await db.init();

  const worker = new Worker<CrawCommentlJob, any>(
    QueueName.POST_COMMENTS,

    async (job) => {
      const { postUrl, account } = job.data;

      console.log(`Start crawling post cmt ${postUrl} \n`);

      const crawler = new PostCommentCrawler(postUrl, account);
      crawler.setLimit(limit);

      const result = await crawler.start();
      console.log(result);
      return result;
    },

    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on('completed', async (job) => {
    const result = job.returnvalue;
    console.log(`Crawled post comments for ${job.data.postUrl} \n`);
    await db.savePost(result);
  });

  worker.on('failed', (job, err) => {
    const account = job.data.account;

    console.log(`Job ${job.id} failed with error ${err} \n`);
    console.error(err);

    checkAccount(account);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  console.log('Worker started for PostComments');
  return worker;
}
