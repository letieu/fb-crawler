import { Account } from "./crawlers/helper";
import Database, { AccountStatus } from "./database/database";
import { getDbConfig } from "./database/helper";

const failLimit = 3;

const accountFailCount = new Map<string, number>();

export async function checkAccount(account: Account) {
  const currentFailCount = accountFailCount.get(account.username) || 0;
  accountFailCount.set(account.username, currentFailCount + 1);

  console.log(`Account ${account.username} failed ${currentFailCount + 1} times`);

  if (currentFailCount >= failLimit) {
    const db = new Database(getDbConfig());
    await db.init();

    await db.updateAccountStatus(account.username, AccountStatus.INACTIVE);
    console.log(`Account ${account.username} marked as inactive`);

    await db.close();
  }
}
