import { Queue } from "bullmq";
import Database from "../database/database";
import {
  LikePageJobData,
  LikePageJobResult,
  QueueName,
  getRedisConnection,
} from "../workers/helper";

export const likePageQueue = new Queue<LikePageJobData, LikePageJobResult>(
  QueueName.LIKE_PAGE,
  {
    connection: getRedisConnection(),
  }
);

export async function createCrawlLikePageJobs(db: Database) {
  await likePageQueue.drain(); // reset queue

  const accounts = await db.getAccounts();
  const pages = await db.getPages();
  const pageLinks: string[] = pages.map((p) => p.link);

  if (!accounts.length) {
    console.log("No groups found");
    return;
  }

  await likePageQueue.addBulk(
    accounts.map((account) => {
      const accountLinkedLink = account.liked;

      return {
        name: `like_page_${account.username}`,
        data: {
          account,
          pageLinks: pageLinks.filter(
            (link) => !accountLinkedLink.includes(link)
          ),
        },
        opts: {
          delay: 1000 * 20,
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      };
    })
  );

  console.log(`Added ${accounts.length} jobs to queue ${QueueName.LIKE_PAGE}`);
}
