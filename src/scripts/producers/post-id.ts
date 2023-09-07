import Database from "../../database/database";
import { getDbConfig } from "../../database/helper";
import { createCrawlPostIdsJobs } from "../../queues/post-id-queue";

async function main() {
  const db = new Database(getDbConfig());
  await db.init();

  await createCrawlPostIdsJobs(db);

  await db.close();

  process.exit(0);
}

main();
