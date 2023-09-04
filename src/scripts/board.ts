import express from 'express';
import QueueMQ from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { crawlQueue } from '../queues/crawl-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(crawlQueue)],
  serverAdapter: serverAdapter,
});

const app = express();

app.use('/queues', serverAdapter.getRouter());

app.listen(3123, () => {
  console.log('Running on 3123...');
  console.log('For the UI, open http://localhost:3123/queues');
});
