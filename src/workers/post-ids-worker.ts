import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler, PostIdsResult } from '../crawlers/post-ids-crawler';
import Database, { AccountStatus } from '../database/database';
import { getDbConfig } from '../database/helper';
import { initPuppeter } from '../crawlers/helper';
import { PostIdJobData, PostIdJobResult, QueueName, getRedisConnection } from './helper';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');

console.log(`Post limit: ${postLimit}`);

export async function startPostIdWorker() {
  const db = new Database(getDbConfig());
  await db.init();

  let account = await getNewAccount(db);

  const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

  let browser = await initPuppeter(
    account,
    chromeWsEndpoint,
  );

  const worker = new Worker<PostIdJobData, PostIdJobResult>(
    QueueName.POST_IDS,
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
    console.log(`Job ${job.id} completed`);
  });

  async function crawlHandler(job: Job<PostIdJobData>) {
    const { url, id: groupId } = job.data;

    let result: PostIdJobResult;

    const page = await browser.newPage();
    page.setViewport({ width: 1500, height: 764 });

    const postIdCrawler = new PostIdsCrawler(url);
    result = await postIdCrawler
      .setLimit(postLimit)
      .setAccount(account)
      .start(page);

    if (result.success) {
      db.savePostLinks(result.data as PostIdsResult, groupId);
    }

    const { loginFailed } = result;

    if (loginFailed) {
      console.log('Login failed, trying to get new account');
      await browser.close();

      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5s

      await db.updateAccountStatus(account.username, 2);

      account = await getNewAccount(db);

      browser = await initPuppeter(
        account,
        chromeWsEndpoint,
      );

      console.log(`Got new account ${account.username}, starting new browser`);
    }

    return result;
  }

  console.log('Post id worker started with account: ', account.username);
  return worker;
}

async function getNewAccount(db: Database) {
  const accounts = await db.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No account found');
  }

  const selectedAccount = accounts[0];

  await db.updateAccountStatus(selectedAccount.username, AccountStatus.IN_USE);

  return selectedAccount;
}
