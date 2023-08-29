import 'dotenv/config';
import { WaitingChildrenError, Worker } from 'bullmq';
import { PostIdsCrawler } from '../crawlers/post-ids-crawler';
import { getRedisConnection } from './helper';
import { Account } from '../crawlers/helper';
import { postCommentsQueue } from '../queues/post-comments';

const limit = 10; // TODO: update

export enum Step {
  GET_POST_IDS = 'GET_POST_IDS',
  GET_COMMENTS = 'GET_COMMENTS',
  FINISH = 'FINISH'
}

export type CrawPostIdslJob = {
  groupId: string;
  account: Account;
  step: Step;
}

export async function startGroupPostIds() {
  const worker = new Worker<CrawPostIdslJob, any>(
    "GroupPostIds",

    async (job, token) => {
      const { groupId, account } = job.data;

      let step = job.data.step;

      while (step !== Step.FINISH) {
        console.log(`Step: ${step}`);

        switch (step) {
          case Step.GET_POST_IDS: {
            const crawler = new PostIdsCrawler(groupId, account);
            crawler.setLimit(limit);
            const postLinks = await crawler.start();

            await postCommentsQueue.addBulk(
              postLinks.map((postUrl) => ({
                name: postUrl,
                data: {
                  postUrl,
                  account,
                },
                opts: {
                  parent: {
                    id: job.id,
                    queue: job.queueQualifiedName,
                  },
                  delay: 3000,
                },
              })),
            );

            await job.updateData({
              step: Step.GET_COMMENTS,
              groupId: groupId,
              account: account,
            });
            step = Step.GET_COMMENTS;
            console.log('change step to GET_COMMENTS');
            break;
          }

          case Step.GET_COMMENTS: {
            const shouldWait = await job.moveToWaitingChildren(token);
            console.log(`shouldWait: ${shouldWait}`);
            if (!shouldWait) {
              await job.updateData({
                step: Step.FINISH,
                groupId: groupId,
                account: account,
              });
              step = Step.FINISH;
              console.log('change step to FINISH');
              return Step.FINISH;
            } else {
              throw new WaitingChildrenError();
            }
          }

          default: {
            throw new Error('invalid step');
          }
        }
      }

    },

    {
      connection: getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on('completed', async (job) => {
    const result = job.returnvalue;

    if (result) {
      console.log(`Crawled ${result.length} post ids`);
    }
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err}`);
  });

  worker.on('error', (err) => {
    console.log(`Global error: ${err}`);
  });

  console.log('Worker started for GroupPostIds');
  return worker;
}
