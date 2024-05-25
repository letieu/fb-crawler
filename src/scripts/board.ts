import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { postIdQueue } from '../queues/post-id-queue';
import { postDetailQueue } from '../queues/post-detail-queue';
import { adsIdQueue } from '../queues/ads-id-queue';
import { likePageQueue } from '../queues/like_page-queue';
import { adsDetailQueue } from '../queues/ads-detail-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(postIdQueue),
    new BullMQAdapter(postDetailQueue),
    new BullMQAdapter(likePageQueue),
    new BullMQAdapter(adsIdQueue),
    new BullMQAdapter(adsDetailQueue),
  ],
  serverAdapter: serverAdapter,
});

const app = express();

app.use('/queues', serverAdapter.getRouter());

app.listen(3123, () => {
  console.log('Running on 3123...');
  console.log('For the UI, open http://localhost:3123/queues');
});
