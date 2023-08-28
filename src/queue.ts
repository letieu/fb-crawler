import { PostCrawler } from './crawler';
import Queue from 'bull';
import Database from './database';

type CrawlJob = {
  url: string;
  postId: number;
}

export class CrawlerQueue {
  crawlQueue: Queue.Queue<CrawlJob>;
  db: Database;

  async init(db: Database) {
    const redisUrl = this.buildRedisConfig();
    this.crawlQueue = new Queue('crawlPost', redisUrl);

    this.crawlQueue.process(async (job) => {
      const { url } = job.data;
      const crawler = new PostCrawler(url, {
        headless: process.env.HEADLESS === 'true'
      });
      const result = await crawler.start();
      return result;
    });

    this.crawlQueue.on('completed', (job, result) => {
      const { postId } = job.data;
      if (result) {
        db.savePost(postId, result);
      }
    });

    this.crawlQueue.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed with error ${err}`);
    });

    this.crawlQueue.on('error', (err) => {
      console.log(`Queue error ${err}`);
    });

    this.crawlQueue.on('waiting', (jobId) => {
      console.log(`Job ${jobId} waiting`);
    });

    this.crawlQueue.on('active', (job) => {
      console.log(`Job ${job.id} active`);
    });

    this.db = db;
  }

  async addCrawlJob(postId: number, url: string, interval: number = 0) {
    await this.crawlQueue.add({ url, postId }, {
      repeat: {
        every: interval * 1000 * 60,
        limit: 20
      },
      delay: 5 * 1000, // delay 5 seconds
      jobId: url
    });

    console.log(`Added job to crawl ${url}, interval ${interval} minutes \n`);
  }

  async removeCrawlJob(jobId: string) {
    await this.crawlQueue.removeRepeatableByKey(jobId);
    console.log(`Removed job ${jobId} \n`);
  }

  async getCrawlJobs() {
    const res = await this.crawlQueue.getRepeatableJobs();
    return res.map(job => ({
      id: job.key,
    }));
  }

  async reloadQueue() {
    const jobs = await this.getCrawlJobs();

    // remove all jobs from queue
    for (const job of jobs) {
      await this.removeCrawlJob(job.id);
    }

    // load all posts from database
    const posts = await this.db.getPosts();

    // add jobs to queue
    for (const post of posts as any) {
      await this.addCrawlJob(post.id, post.link, post.interval ?? +process.env.INTERVAL);
    }
  }

  private buildRedisConfig(): Queue.QueueOptions {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = +process.env.REDIS_PORT;
    const redisPassword = process.env.REDIS_PASSWORD;

    if (!redisHost || !redisPort || !redisPassword) throw new Error('Redis host and port, password must be set');

    return { redis: { port: redisPort, host: redisHost, password: redisPassword } };
  }
}
