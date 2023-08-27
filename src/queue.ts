import { PostCrawler } from './crawler';
import Queue from 'bull';
import Database from './database';

type CrawlJob = {
  url: string;
}

export class CrawlerQueue {
  crawlQueue: Queue.Queue<CrawlJob>;

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
      console.log(`Job ${job.id} completed with result ${result}`);
      db.savePost(result);
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

  }

  async addCrawlJob(url: string, interval: number = 0) {
    await this.crawlQueue.add({ url }, {
      repeat: {
        every: interval * 1000 * 60,
        limit: 100
      },
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

  async updateCrawlJob(jobId: string, interval: number) {
    await this.crawlQueue.removeRepeatableByKey(jobId);
    await this.addCrawlJob(jobId, interval);
    console.log(`Updated job ${jobId} with interval ${interval} minutes \n`);
  }

  private buildRedisConfig(): Queue.QueueOptions {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = +process.env.REDIS_PORT;
    const redisPassword = process.env.REDIS_PASSWORD;

    if (!redisHost || !redisPort || !redisPassword) throw new Error('Redis host and port, password must be set');

    return { redis: { port: redisPort, host: redisHost, password: redisPassword } };
  }
}
