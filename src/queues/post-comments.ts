import { PostCommentCrawler } from '../crawlers/post-comments-crawler';
import Queue from 'bull';
import Database from '../database';

type CrawlJob = {
  postUrl: string;
  postId: number;
  profileId?: number;
}

export class PostCommentsQueue {
  queue: Queue.Queue<CrawlJob>;
  db: Database;

  async init(db: Database) {
    const redisUrl = this.buildRedisConfig();
    this.queue = new Queue('comment', redisUrl);

    this.queue.process(async (job) => {
      const { postUrl, profileId } = job.data;
      const crawler = new PostCommentCrawler(postUrl, {
        profileId
      });
      const result = await crawler.start();
      return result;
    });

    this.queue.on('completed', (job, result) => {
      const { postId } = job.data;
      if (result) {
        db.savePost(postId, result);
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
  }

  async addCrawlJob(postId: number, url: string, interval: number = 0) {
    await this.queue.add({ postUrl: url, postId }, {
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
    await this.queue.removeRepeatableByKey(jobId);
    console.log(`Removed job ${jobId} \n`);
  }

  async getCrawlJobs() {
    const res = await this.queue.getRepeatableJobs();
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
