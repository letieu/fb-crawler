import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { CrawlJobData, CrawlJobResult, JobType, QueueName, getRedisConnection } from './helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostDetailCrawler } from '../crawlers/post-comments-crawler';
import { checkAccount } from '../account-check';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');
const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');

console.log(`Post limit: ${postLimit}`);
console.log(`Comment limit: ${commentLimit}`);

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
    const { loginFailed } = job.returnvalue;
    if (loginFailed) {
      await checkAccount(job.data.account);
    }
  });

  async function crawlHandler(job: Job<CrawlJobData>) {
    const { url, account, type } = job.data;

    switch (type) {
      case JobType.POST_IDS:
        const postIdCrawler = new PostIdsCrawler(url, account);
        const postIdsResult = await postIdCrawler
          .setLimit(postLimit)
          .start();

        if (postIdsResult.success) {
          db.savePostLinks(postIdsResult.data);
        }

        return postIdsResult;

      case JobType.POST_DETAIL:
        const postDetailCrawler = new PostDetailCrawler(url, account);
        const postDetailResult = await postDetailCrawler
          .setLimit(commentLimit)
          .start();

        if (postDetailResult.success) {
          db.savePost({
            content: postDetailResult.data.content,
            link: postDetailResult.data.link,
            comments: postDetailResult.data.comments,
          });
        }

        return postDetailResult;

      default:
        throw new Error(`Invalid type ${type}`);
    }
  }

  return worker;
}
