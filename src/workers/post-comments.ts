import 'dotenv/config';
import { Worker } from 'bullmq';
import { Account } from "../crawlers/helper";
import { getRedisConnection } from './helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostCommentCrawler } from '../crawlers/post-comments-crawler';

const limit = 10; // TODO: update

export type CrawCommentlJob = {
  postUrl: string;
  account: Account;
}

export async function startPostComments() {
  const db = new Database(getDbConfig());
  await db.init();

  const worker = new Worker<CrawCommentlJob, any>(
    "PostComments",

    async (job, token) => {
      const { postUrl, account } = job.data;

      const crawler = new PostCommentCrawler(postUrl, account);
      crawler.setLimit(limit);

      const result = await crawler.start();
      return result;
    },

    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on('completed', async (job) => {
    const result = job.returnvalue;
    await db.savePost(result);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err}`);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  console.log('Worker started for PostComments');
  return worker;
}
