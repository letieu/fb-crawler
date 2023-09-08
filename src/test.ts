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

  const postDetailCrawler = new PostDetailCrawler("https://www.facebook.com/groups/581509213010882/posts/1029138028247996/");

  const result = await postDetailCrawler
    .setLimit(10)
    .setAccount(account)
    .start();

  console.log(result);

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
