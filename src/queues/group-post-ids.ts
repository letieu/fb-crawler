import Queue from 'bull';
import Database from '../database/database';
import { Account } from '../crawlers/helper';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { buildRedisConfig } from './helper';
import { PostCommentsQueue } from './post-comments';

type CrawPostIdslJob = {
  groupId: string;
  account: Account;
}

export class GroupPostIdsQueue {
  queue: Queue.Queue<CrawPostIdslJob>;
  db: Database;
  commentQueue: PostCommentsQueue;

  async init(db: Database, commentQueue: PostCommentsQueue, limit: number = 100) {
    const redisUrl = buildRedisConfig();
    this.queue = new Queue('postId', redisUrl);

    this.queue.process(async (job) => {
      const { groupId, account } = job.data;
      const crawler = new PostIdsCrawler(groupId, account);
      crawler.setLimit(limit);

      const result = await crawler.start();
      return result;
    });

    this.queue.on('completed', async (job, result) => {
      if (result) {
        console.log(`Crawled ${result.length} post ids`);
        for await (const postUrl of result) {
          await commentQueue.addCrawlJob(job.data.account, postUrl);
        }
      }
    });

    this.queue.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed with error ${err}`);
    });

    this.queue.on('error', (err) => {
      console.log(`Queue error ${err}`);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`Job ${jobId} waiting`);
    });

    this.queue.on('active', (job) => {
      console.log(`Job ${job.id} active`);
    });

    this.db = db;
    this.commentQueue = commentQueue;

    console.log('Group post ids queue started');
  }

  async addCrawlJob(account: Account, id: string) {
    await this.queue.add({ groupId: id, account }, {
      delay: 5 * 1000, // delay 5 seconds
    });

    console.log(`Added job to crawl group ${id} \n`);
  }

  async removeCrawlJob(jobId: string) {
    await this.queue.removeRepeatableByKey(jobId);
    console.log(`Removed job ${jobId} \n`);
  }

  async getCrawlJobs() {
    const res = await this.queue.getRepeatableJobs();
    return res.map(job => ({
      id: job.key,
    }));
  }

  async removeAllJobs() {
    await this.queue.empty();
  }

}
