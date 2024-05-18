import Database from "../../database/database";
import { createCrawlAdsDetailJobs } from "../../queues/ads-detail-queue";
import {  } from "../../queues/post-detail-queue";

async function main() {
  const db = Database.getInstance();

  await createCrawlAdsDetailJobs(db);

  process.exit(0);
}

main();
