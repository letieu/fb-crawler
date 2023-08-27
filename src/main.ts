import { ConnectionOptions } from "mysql2";
import Database from "./database";
import { BackgroundCrawler } from "./scheduler";
import 'dotenv/config';

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

  const jobConfigs = await db.loadJobConfigs();

  if (jobConfigs.length === 0) {
    console.log('No jobs to run. Exiting...');
    await db.close();
    process.exit();
  }

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
