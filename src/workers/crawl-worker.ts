import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import { PostIdsCrawler, PostIdsResult } from '../crawlers/post-ids-crawler';
import { CrawlJobData, CrawlJobResult, JobType, QueueName, getRedisConnection } from './helper';
import Database from '../database/database';
import { getDbConfig } from '../database/helper';
import { PostDetailCrawler, PostDetailResult } from '../crawlers/post-comments-crawler';
import { initPuppeter } from '../crawlers/helper';

const postLimit = parseInt(process.env.POST_IDS_LIMIT || '20');
const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');

console.log(`Post limit: ${postLimit}`);
console.log(`Comment limit: ${commentLimit}`);

export async function startCrawlWorker() {
  const db = new Database(getDbConfig());
  await db.init();

  let account = await getNewAccount(db);

  let browser = await initPuppeter(
    account,
    process.env.CHROME_WS_ENDPOINT,
  );

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
    console.log(`Job ${job.id} completed`);
  });

  async function crawlHandler(job: Job<CrawlJobData>) {
    const { url, type, id } = job.data;

    let result: CrawlJobResult;

    const page = await browser.newPage();
    page.setViewport({ width: 1500, height: 764 });

    switch (type) {
      case JobType.POST_IDS:
        const postIdCrawler = new PostIdsCrawler(url);
        result = await postIdCrawler
          .setLimit(postLimit)
          .setAccount(account)
          .start(page);

        if (result.success) {
          db.savePostLinks(result.data as PostIdsResult, id);
        }

        break;

      case JobType.POST_DETAIL:
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

        break;

      default:
        throw new Error(`Invalid type ${type}`);
    }

    await page.close();

    const { loginFailed } = result;

    if (loginFailed) {
      console.log('Login failed, trying to get new account');
      await browser.close();

      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5s

      await db.updateAccountStatus(account.username, 2);

      account = await getNewAccount(db);

      browser = await initPuppeter(
        account,
        process.env.CHROME_WS_ENDPOINT,
      );

      console.log(`Got new account ${account.username}, starting new browser`);
    }

    return result;
  }

  console.log('Crawl worker started with account: ', account.username);
  return worker;
}

async function getNewAccount(db: Database) {
  const accounts = await db.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No account found');
  }
  return accounts[0];
}
