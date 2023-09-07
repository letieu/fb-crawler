import Database from "../../database/database";
import { getDbConfig } from "../../database/helper";
import { createCrawlPostDetailJobs } from "../../queues/post-detail-queue";

async function main() {
  const db = new Database(getDbConfig());
  await db.init();

  await createCrawlPostDetailJobs(db);

  await db.close();

  process.exit(0);
}

main();
