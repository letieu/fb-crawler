import { ConnectionOptions } from "mysql2";
import Database from "./database";
import { BackgroundCrawler } from "./scheduler";
import 'dotenv/config';

const dbConfig: ConnectionOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DATABASE,
};

async function main() {
  const db = new Database(dbConfig);
  await db.init();

  const jobConfigs = await db.loadJobConfigs();

  const backgroundCrawler = new BackgroundCrawler(jobConfigs, db);
  await backgroundCrawler.setupJobs();

  process.on('SIGINT', async () => {
    console.log('Stopping background crawler...');
    backgroundCrawler.stop();
    await db.close();
    process.exit();
  });
}

main().catch(console.error);

// const crawlerConfig = [
//   { url: 'https://mbasic.facebook.com/groups/817474248860972/posts/1373289956612729/', interval: 1 }, // Crawls every 10 minutes
//   { url: 'https://mbasic.facebook.com/groups/817474248860972/posts/1373289956612729/', interval: 30 }, // Crawls every 30 minutes
// ];
