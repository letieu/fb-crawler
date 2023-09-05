import Database from "../database/database";
import { getDbConfig } from "../database/helper";

async function main() {
  const db = new Database(getDbConfig());
  await db.init();

  const result = await db.markOldPostAsInactive(3);
  console.log(`Marked ${result.affectedRows} posts as inactive`);

  db.close();
}

main();
