import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler, PostIdsResult } from '../crawlers/post-ids-crawler';
import Database, { AccountStatus } from '../database/database';
import { initPuppeter } from '../crawlers/helper';
import { PostIdJobData, PostIdJobResult, QueueName, getRedisConnection } from './helper';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');
const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

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
    let browser = await initPuppeter(
      account,
      chromeWsEndpoint,
    );
    const page = await browser.newPage();
    page.setViewport({ width: 1500, height: 764 });

    const postIdCrawler = new PostIdsCrawler(url);
    const result = await postIdCrawler
      .setLimit(postLimit)
      .setAccount(account)
      .start(page);

    await browser.close();

    if (result.success) {
      db.savePostLinks(result.data as PostIdsResult, groupId);
    } else if (result.loginFailed) {
      console.log('Login failed, trying to get new account');
      await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
      account = await db.getNewAccount();
      console.log(`Got new account ${account.username}`);
    }

    return result;
  }

  console.log('Post id worker started with account: ', account.username);
  return worker;
}
