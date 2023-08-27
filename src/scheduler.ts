import * as schedule from 'node-schedule';
import { PostCrawler } from './crawler';
import Database from './database';

export class BackgroundCrawler {
  private jobs: schedule.Job[] = [];

  constructor(private config: { url: string; interval: number }[], private db: Database) { }

  setupJobs() {
    for (const { url, interval } of this.config) {
      const crawler = new PostCrawler(url);
      const job = schedule.scheduleJob(`*/${interval} * * * *`, async () => {
        const result = await crawler.start();
        await this.db.savePost(result);
        console.log(`Crawled ${url} at ${new Date().toISOString()}`);
      });
      this.jobs.push(job);
      console.log(`Scheduled crawler for ${url} to run every ${interval} minutes`);
    }
  }

  stop() {
    schedule.gracefulShutdown()
  }
}
