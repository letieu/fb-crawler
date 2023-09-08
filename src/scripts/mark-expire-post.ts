import Database from "../database/database";

async function main() {
  const db = await Database.getInstance();
  const result = await db.markOldPostAsInactive(3);
  console.log(`Marked ${result.affectedRows} posts as inactive`);
}

main();
