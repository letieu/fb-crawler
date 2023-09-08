import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import Database, { AccountStatus } from '../database/database';
import { PostDetailCrawler, PostDetailResult } from '../crawlers/post-comments-crawler';
import { initPuppeter } from '../crawlers/helper';
import { PostDetailJobData, PostDetailJobResult, QueueName, getRedisConnection } from './helper';

const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');
const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_DETAIL;

console.log(`Comment limit: ${commentLimit}`);

export async function startPostDetailWorker() {
  let account = await getNewAccount();

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
    let browser = await initPuppeter(
      account,
      chromeWsEndpoint,
    );
    const page = await browser.newPage();
    page.setViewport({ width: 1500, height: 764 });

    const db = Database.getInstance();

    const { url } = job.data;

    const postDetailCrawler = new PostDetailCrawler(url);
    const result = await postDetailCrawler
      .setLimit(commentLimit)
      .setAccount(account)
      .start(page);

    await browser.close();

    if (result.success) {
      const data = result.data as PostDetailResult;
      db.savePost({
        content: data.content,
        link: data.link,
        comments: data.comments,
      });
    } else if (result.loginFailed) {
      console.log('Login failed, trying to get new account');
      await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
      account = await getNewAccount();
      console.log(`Got new account ${account.username}`);
    }

    return result;
  }

  console.log('Post detail worker started with account: ', account.username);
  return worker;
}

async function getNewAccount() {
  const db = Database.getInstance();

  const accounts = await db.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No account found');
  }

  const selectedAccount = accounts[0];

  await db.updateAccountStatus(selectedAccount.username, AccountStatus.IN_USE);

  return selectedAccount;
}
