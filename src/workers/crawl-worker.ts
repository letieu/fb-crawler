import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { CrawlJobData, CrawlJobResult, JobType, QueueName, getRedisConnection } from './helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostDetailCrawler } from '../crawlers/post-comments-crawler';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');
const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');

export async function startCrawlWorker() {
  const db = new Database(getDbConfig());
  await db.init();

  const worker = new Worker<CrawlJobData, CrawlJobResult>(
    QueueName.CRAWL,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error: \n`);
    console.error(err);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  worker.on('completed', async (job) => {
    console.log(`Job ${job.id} completed with result: \n`);
    console.log(job.returnvalue);
  });

  console.log('Worker started for GroupPostIds');
  return worker;
}


async function crawlHandler(job: Job<CrawlJobData>) {
  const { url, account, type } = job.data;

  switch (type) {
    case JobType.POST_IDS:
      const postIdCrawler = new PostIdsCrawler(url, account);
      return postIdCrawler
        .setLimit(postLimit)
        .start();

    case JobType.POST_DETAIL:
      const postDetailCrawler = new PostDetailCrawler(url, account);
      return postDetailCrawler
        .setLimit(commentLimit)
        .start();

    default:
      throw new Error(`Invalid type ${type}`);
  }
}
