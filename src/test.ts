import 'dotenv/config';
import { initPuppeter } from './crawlers/helper';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { PostDetailCrawler } from './crawlers/post-comments-crawler';

const account = {
  username: "100062953837045",
  password: "haihau2029",
  secretCode: "DXLXICOMNBHMXXO2UMPKIXTEHFJPJLOC"
}

async function testCrawl() {

  const browser = await initPuppeter(
    account,
    process.env.CHROME_WS_ENDPOINT_ID,
  );

  const page = await browser.newPage();
  page.setViewport({ width: 1500, height: 764 });

  const postDetailCrawler = new PostDetailCrawler("https://www.facebook.com/groups/581509213010882/posts/1029138028247996/");

  const result = await postDetailCrawler
    .setLimit(10)
    .setAccount(account)
    .start(page);

  console.log(result);

  await page.close();
  console.log("Page closed");

  await new Promise((resolve) => setTimeout(resolve, 50000));
}

async function testDb() {
  const db = await Database.getInstance();

  const posts = await db.getPosts();
  console.log(posts);
}

// testTrigger();
testCrawl();
// testDb();
