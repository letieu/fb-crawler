import 'dotenv/config';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { getGroupIdFromUrl } from './crawlers/helper';
import { startPostComments } from './workers/post-comments';
import { startGroupPostIds } from './workers/group-post-ids';

const db = new Database(getDbConfig());

async function main() {
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

async function triggerCrawl() {
  const groups = await db.getGroups();
  const accounts = await db.getAccounts();

  // await groupPostIdsQueue.removeAllJobs();
  // await postCommentsQueue.removeAllJobs();

  for await (const group of groups) {
    const account = getRandomAccount(accounts);
    const groupId = getGroupIdFromUrl(group.link);
    console.log(`Crawling group ${groupId} with account ${account.username}`);

    // await groupPostIdsQueue.addCrawlJob(account, groupId);
  }
}

function getRandomAccount(accounts: any[]) {
  const index = Math.floor(Math.random() * accounts.length);
  return accounts[index];
}

main().catch(console.error);
