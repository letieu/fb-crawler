import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import Database, { AccountStatus } from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostDetailCrawler, PostDetailResult } from '../crawlers/post-comments-crawler';
import { initPuppeter } from '../crawlers/helper';
import { PostDetailJobData, PostDetailJobResult, QueueName, getRedisConnection } from './helper';

const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');

console.log(`Comment limit: ${commentLimit}`);

export async function startPostDetailWorker() {
  let account = await getNewAccount();

  const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_DETAIL;

  let browser = await initPuppeter(
    account,
    chromeWsEndpoint,
  );

  const worker = new Worker<PostDetailJobData, PostDetailJobResult>(
    QueueName.POST_DETAIL,
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

  async function crawlHandler(job: Job<PostDetailJobData>) {
    const { url, id } = job.data;
    const db = await Database.getInstance();

    let result: PostDetailJobResult;

    const page = await browser.newPage();
    page.setViewport({ width: 1500, height: 764 });

    const postDetailCrawler = new PostDetailCrawler(url);
    result = await postDetailCrawler
      .setLimit(commentLimit)
      .setAccount(account)
      .start(page);

    if (result.success) {
      const data = result.data as PostDetailResult;
      db.savePost({
        content: data.content,
        link: data.link,
        comments: data.comments,
      });
    }

    const { loginFailed } = result;

    if (loginFailed) {
      console.log('Login failed, trying to get new account');
      await browser.close();

      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5s

      await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);

      account = await getNewAccount();

      browser = await initPuppeter(
        account,
        process.env.CHROME_WS_ENDPOINT,
      );

      console.log(`Got new account ${account.username}, starting new browser`);
    }

    return result;
  }

  console.log('Post detail worker started with account: ', account.username);
  return worker;
}

async function getNewAccount() {
  const db = await Database.getInstance();

  const accounts = await db.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No account found');
  }

  const selectedAccount = accounts[0];

  await db.updateAccountStatus(selectedAccount.username, AccountStatus.IN_USE);

  return selectedAccount;
}
