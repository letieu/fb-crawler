import 'dotenv/config';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { getGroupIdFromUrl } from './crawlers/helper';
import { startPostComments } from './workers/post-comments';
import { startGroupPostIds } from './workers/group-post-ids';
import schedule from 'node-schedule';
import { groupPostIdsQueue } from './queues/group-post-ids';
import { postCommentsQueue } from './queues/post-comments';

const db = new Database(getDbConfig());

async function main() {
  await triggerCrawl();

  const w1 = await startPostComments();
  const w2 = await startGroupPostIds();

  // graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await db.close();
    await w1.close();
    await w2.close();
    process.exit(0);
  });
}

// clean up all jobs in queue and start crawling again
async function triggerCrawl() {
  await db.init();

  const groups = await db.getGroups();
  const accounts = await db.getAccounts();

  await groupPostIdsQueue.drain();
  await postCommentsQueue.drain();

  await groupPostIdsQueue.addBulk(groups.map((group) => ({
    name: group.link,
    data: {
      account: getRandomAccount(accounts),
      groupId: getGroupIdFromUrl(group.link),
    },
    opts: {
      attempts: 2,
      delay: 1000 * 20,
    },
  })));

  console.log('All jobs added');
}

function getRandomAccount(accounts: any[]) {
  const index = Math.floor(Math.random() * accounts.length);
  return accounts[index];
}

// run main every 8 hours
schedule.scheduleJob(
  process.env.CRON_TIME ?? '* 0 */8 * * *',
  async () => {
    try {
      await main();
    } catch (err) {
      console.log(err);
    }
  }
);

process.on('SIGINT', function () {
  schedule.gracefulShutdown()
    .then(() => process.exit(0))
});

console.log(`Schedule: ${process.env.CRON_TIME ?? '* 0 */8 * * *'}`);

main();
console.log('Crawler started for the first time');
