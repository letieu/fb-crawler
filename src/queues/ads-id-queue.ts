import { Queue } from 'bullmq';
import Database from '../database/database';
import { AdsIdJobData, AdsIdJobResult, QueueName, getRedisConnection } from '../workers/helper';

export const adsIdQueue = new Queue<AdsIdJobData, AdsIdJobResult>(QueueName.ADS_IDS, {
  connection: getRedisConnection()
});

export async function createCrawlAdsIdsJobs(db: Database) {
  await adsIdQueue.drain(); // reset queue

  const accounts = await db.getAccounts();

  if (!accounts.length) {
    console.log('No groups found');
    return;
  }

  await adsIdQueue.addBulk(accounts.map((account) => ({
    name: `ads_id_${account.username}`,
    data: {
      account,
    },
    opts: {
      delay: 1000 * 20,
      removeOnComplete: 20,
      removeOnFail: 50
    },
  })));

  console.log(`Added ${accounts.length} jobs to queue ${QueueName.ADS_IDS}`);
}
