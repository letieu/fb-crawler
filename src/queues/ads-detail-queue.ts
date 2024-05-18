import { Queue } from "bullmq";
import Database from "../database/database";
import {
  PostDetailJobData,
  PostDetailJobResult,
  QueueName,
  getRedisConnection,
} from "../workers/helper";

export const adsDetailQueue = new Queue<PostDetailJobData, PostDetailJobResult>(
  QueueName.ADS_DETAIL,
  {
    connection: getRedisConnection(),
  }
);

export async function createCrawlAdsDetailJobs(db: Database) {
  await adsDetailQueue.drain(); // reset queue

  const ads = await db.getAds();

  if (!ads.length) {
    console.log("No ads found");
    return;
  }

  await adsDetailQueue.addBulk(
    ads.map((post) => ({
      name: post.fb_id,
      data: {
        url: post.link,
      },
      opts: {
        delay: 1000 * 20,
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    }))
  );

  console.log(`Added ${ads.length} jobs of type ${QueueName.ADS_DETAIL}`);
}
