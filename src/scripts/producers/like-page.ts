import Database from "../../database/database";
import { createCrawlLikePageJobs } from "../../queues/like_page-queue";

async function main() {
  const db = Database.getInstance();
  await createCrawlLikePageJobs(db);

  process.exit(0);
}

main();
