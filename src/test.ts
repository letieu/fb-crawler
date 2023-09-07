import 'dotenv/config';
import { initPuppeter } from './crawlers/helper';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';

const account = {
  username: "100062953837045",
  password: "haihau2029",
  secretCode: "DXLXICOMNBHMXXO2UMPKIXTEHFJPJLOC"
}

async function testCrawl() {
  const browser = await initPuppeter(
    account,
    process.env.CHROME_WS_ENDPOINT,
  );
  const page = await browser.newPage();
  page.setViewport({ width: 1500, height: 764 });

  const url = "https://www.facebook.com/groups/366991508140251/";

  const crawler = new PostIdsCrawler(url);
  const result = await crawler
    .setLimit(50)
    .setAccount(account)
    .start(page);

  console.log(result);
}

async function testDb() {
  const db = new Database(getDbConfig());
  await db.init();

  const posts = await db.getPosts();
  console.log(posts);
}

// testTrigger();
testCrawl();
// testDb();
