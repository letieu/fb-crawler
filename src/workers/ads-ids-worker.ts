import "dotenv/config";
import { Job, Worker } from "bullmq";
import Database, { AccountStatus } from "../database/database";
import {
  AdsIdJobData,
  AdsIdJobResult,
  QueueName,
  getRedisConnection,
} from "./helper";
import { AdsIdsCrawler, AdsIdsResult } from "../crawlers/ads-ids-crawler";

const db = Database.getInstance();

export async function startPostIdWorker() {
  const worker = new Worker<AdsIdJobData, AdsIdJobResult>(
    QueueName.POST_IDS,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  async function crawlHandler(job: Job<AdsIdJobData>) {
    const { account } = job.data;

    const postIdCrawler = new AdsIdsCrawler();
    const result = await postIdCrawler.setAccount(account).start();

    if (result.success) {
      await db.saveAdsLinks(result.data as AdsIdsResult);
    } else if (result.loginFailed) {
      //await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
      console.log(result);
    }

    // Wait 1 seconds before processing next job
    await new Promise((resolve) => setTimeout(resolve, 1000 * 10));

    return result;
  }

  console.log("Ads id worker started");
  return worker;
}
