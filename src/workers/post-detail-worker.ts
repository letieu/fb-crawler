import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import Database, { AccountStatus } from '../database/database';
import { PostDetailCrawler, PostDetailResult } from '../crawlers/post-comments-crawler';
import { PostDetailJobData, PostDetailJobResult, QueueName, getRedisConnection } from './helper';

const commentLimit = parseInt(process.env.POST_COMMENTS_LIMIT || '20');

console.log(`Comment limit: ${commentLimit}`);

const db = Database.getInstance();

export async function startPostDetailWorker() {
  let account = await db.getNewAccount();

  const worker = new Worker<PostDetailJobData, PostDetailJobResult>(
    QueueName.POST_DETAIL,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  async function crawlHandler(job: Job<PostDetailJobData>) {
    const { url } = job.data;

    const postDetailCrawler = new PostDetailCrawler(url);
    const result = await postDetailCrawler
      .setLimit(commentLimit)
      .setAccount(account)
      .start()

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
      account = await db.getNewAccount();
      console.log(`Got new account ${account.username}`);
    }

    return result;
  }

  console.log('Post detail worker started with account: ', account.username);
  return worker;
}
