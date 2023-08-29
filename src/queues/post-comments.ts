import { PostCommentCrawler } from '../crawlers/post-comments-crawler';
import Queue from 'bull';
import Database from '../database/database';
import { Account } from '../crawlers/helper';
import { buildRedisConfig } from './helper';

type CrawCommentlJob = {
  postUrl: string;
  account: Account;
}

export class PostCommentsQueue {
  queue: Queue.Queue<CrawCommentlJob>;
  db: Database;

  async init(db: Database, limit: number = 100) {
    const redisUrl = buildRedisConfig();
    this.queue = new Queue('comment', redisUrl);

    this.queue.process(async (job) => {
      const { postUrl, account } = job.data;
      const crawler = new PostCommentCrawler(postUrl, account);
      crawler.setLimit(limit);

      const result = await crawler.start();
      return result;
    });

    this.queue.on('completed', (job, result) => {
      if (result) {
        db.savePost(result);
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

    console.log('Post comments queue started');
  }

  async addCrawlJob(account: Account, url: string) {
    await this.queue.add({ postUrl: url, account }, {
      delay: 5 * 1000, // delay 5 seconds
    });

    console.log(`Added job to crawl post ${url} \n`);
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
