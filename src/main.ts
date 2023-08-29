import 'dotenv/config';
import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { PostCommentsQueue } from './queues/post-comments';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import fs from 'fs';
import YAML from 'yaml';
import Database from './database/database';
import { GroupPostIdsQueue } from './queues/group-post-ids';
import { getDbConfig } from './database/helper';
import { getGroupIdFromUrl } from './crawlers/helper';

const file = fs.readFileSync('./swagger.yaml', 'utf8')
// const swaggerDocument = YAML.parse(file)


const postCommentsQueue = new PostCommentsQueue();
const groupPostIdsQueue = new GroupPostIdsQueue();

const db = new Database(getDbConfig());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');

async function main() {
  await db.init();
  await postCommentsQueue.init(db); // limit = 100 comments per post by default
  await groupPostIdsQueue.init(db, postCommentsQueue); // limit = 100 post ids per group by default

  createBullBoard({
    queues: [
      new BullAdapter(postCommentsQueue.queue),
      new BullAdapter(groupPostIdsQueue.queue)
    ],
    serverAdapter: serverAdapter,
  });

  const app = express();
  app.use(bodyParser.json());
  app.use('/queues', serverAdapter.getRouter());

  app.listen(+process.env.APP_PORT, () => {
    console.log('Running on 3000...');
    console.log('For the UI, open http://localhost:3000/queues');
  });

  await triggerCrawl(db, groupPostIdsQueue);
}

async function triggerCrawl(db: Database, groupPostIdsQueue: GroupPostIdsQueue) {
  const groups = await db.getGroups();
  const accounts = await db.getAccounts();

  await groupPostIdsQueue.removeAllJobs();
  await postCommentsQueue.removeAllJobs();

  for await (const group of groups) {
    const account = getRandomAccount(accounts);
    const groupId = getGroupIdFromUrl(group.link);
    console.log(`Crawling group ${groupId} with account ${account.username}`);

    await groupPostIdsQueue.addCrawlJob(account, groupId);
  }
}

function getRandomAccount(accounts: any[]) {
  const index = Math.floor(Math.random() * accounts.length);
  return accounts[index];
}

main().catch(console.error);
