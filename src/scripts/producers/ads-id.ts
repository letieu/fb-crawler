import Database from "../../database/database";
import { createCrawlPostIdsJobs } from "../../queues/post-id-queue";

async function main() {
  const db = await Database.getInstance();

  await createCrawlPostIdsJobs(db);

  process.exit(0);
}

main();
