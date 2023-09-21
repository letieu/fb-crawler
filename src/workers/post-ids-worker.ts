import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler, PostIdsResult } from '../crawlers/post-ids-crawler';
import Database, { AccountStatus } from '../database/database';
import { PostIdJobData, PostIdJobResult, QueueName, getRedisConnection } from './helper';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');

console.log(`Post limit: ${postLimit}`);

const db = Database.getInstance();

export async function startPostIdWorker() {
  let account = await db.getNewAccount();

  const worker = new Worker<PostIdJobData, PostIdJobResult>(
    QueueName.POST_IDS,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  async function crawlHandler(job: Job<PostIdJobData>) {
    const { url, id: groupId } = job.data;

    const postIdCrawler = new PostIdsCrawler(url);
    const result = await postIdCrawler
      .setLimit(postLimit)
      .setAccount(account)
      .start();

    if (result.success) {
      await db.savePostLinks(result.data as PostIdsResult, groupId);
    } else if (result.loginFailed) {
      console.log('Login failed, trying to get new account');
      await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
      account = await db.getNewAccount();
      console.log(`Got new account ${account.username}`);

      // Wait 10 seconds after getting new account
      await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
    }

    // Wait 1 seconds before processing next job
    await new Promise((resolve) => setTimeout(resolve, 1000 * 10));

    return result;
  }

  console.log('Post id worker started with account: ', account.username);
  return worker;
}
