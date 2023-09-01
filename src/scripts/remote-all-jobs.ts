import { crawlQueue } from "../queues/crawl-queue";

crawlQueue.drain().then(() => {
  console.log("drain");
  process.exit(0);
});
