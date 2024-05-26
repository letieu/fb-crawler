import Database from "../../database/database";
import { createCrawlPostDetailJobs } from "../../queues/post-detail-queue";

async function main() {
  const db = Database.getInstance();

  await createCrawlPostDetailJobs(db);

  process.exit(0);
}

main();
