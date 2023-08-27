import { ConnectionOptions } from "mysql2";
import Database from "./database";
import 'dotenv/config';
import { CrawlerQueue } from "./queue";

const dbConfig: ConnectionOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

async function main() {
  const db = new Database(dbConfig);
  await db.init();

  const queue = new CrawlerQueue();

  await queue.addCrawlJob(
    'https://www.facebook.com/groups/2571741279631519?multi_permalinks=4190719027733728&hoisted_section_header_type=recently_seen',
    1
  );

  await queue.addCrawlJob(
    'https://www.facebook.com/groups/817474248860972?multi_permalinks=1373989419876116&hoisted_section_header_type=recently_seen',
    1
  );
}

main().catch(console.error);
