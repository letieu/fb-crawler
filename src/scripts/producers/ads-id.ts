import Database from "../../database/database";
import { createCrawlAdsIdsJobs } from "../../queues/ads-id-queue";

async function main() {
  const db = Database.getInstance();

  await createCrawlAdsIdsJobs(db);

  process.exit(0);
}

main();
