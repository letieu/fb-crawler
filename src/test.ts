import 'dotenv/config';
import Database from "./database/database";
import { getDbConfig } from "./database/helper";
import { groupPostIdsQueue } from './queues/group-post-ids';
import { Step } from './workers/group-post-ids';
import { postCommentsQueue } from './queues/post-comments';

async function test() {
  const account = {
    username: "100082164458134",
    password: "123@Xuanzhi",
    secretCode: "R333PGH6XGFDL34ZFM3Z5YYCZOTEBPZW"
  }

  await groupPostIdsQueue.drain();
  await postCommentsQueue.drain();

  await groupPostIdsQueue.addBulk([
    {
      name: 'canthoanuong',
      data: {
        account: account,
        groupId: 'canthoanuong',
        step: Step.GET_POST_IDS
      },
      opts: {
        delay: 3000
      },
    },
    {
      name: '817474248860972eld',
      data: {
        groupId: '817474248860972eld',
        account: account,
        step: Step.GET_POST_IDS
      },

      opts: {
        delay: 3000
      },
    }
  ]);

  console.log('done');
}

test().catch(console.error);
