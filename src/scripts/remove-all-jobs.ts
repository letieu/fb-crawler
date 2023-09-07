import { crawlQueue } from "../queues/post-id-queue";

crawlQueue.drain().then(() => {
  console.log("drain");
  process.exit(0);
});
