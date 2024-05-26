import "dotenv/config";
import { Job, Worker } from "bullmq";
import Database, { AccountStatus } from "../database/database";
import {
  LikePageJobData,
  LikePageJobResult,
  QueueName,
  getRedisConnection,
} from "./helper";
import { LikePageCrawler } from "../crawlers/like-page-crawler";

const db = Database.getInstance();

export async function startLikePageWorker() {
  const worker = new Worker<LikePageJobData, LikePageJobResult>(
    QueueName.LIKE_PAGE,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  async function crawlHandler(job: Job<LikePageJobData>) {
    const { account, pageLinks } = job.data;

    const postIdCrawler = new LikePageCrawler();
    const result = await postIdCrawler.setAccount(account).start(pageLinks);

    // Wait 1 seconds before processing next job
    await new Promise((resolve) => setTimeout(resolve, 1000 * 10));

    if (result.success) {
      const data = result.data;
      await db.saveLiked(account.username, data.liked);
    }

    return result;
  }

  console.log("Like page worker was started");
  return worker;
}
