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

export async function startAdsIdWorker() {
  const worker = new Worker<AdsIdJobData, AdsIdJobResult>(
    QueueName.ADS_IDS,
    crawlHandler,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  async function crawlHandler(job: Job<AdsIdJobData>) {
    const { account } = job.data;

    const adsIdCrawler = new AdsIdsCrawler();
    const result = await adsIdCrawler.setAccount(account).start();

    if (result.success) {
      await db.saveAdsLinks(result.data as AdsIdsResult);
    } else if (result.loginFailed) {
      //await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
    }

    // Wait 1 seconds before processing next job
    await new Promise((resolve) => setTimeout(resolve, 1000 * 10));

    return result;
  }

  console.log("Ads id worker started");
  return worker;
}
