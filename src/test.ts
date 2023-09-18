import 'dotenv/config';
import { initPuppeter } from './crawlers/helper';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { PostDetailCrawler } from './crawlers/post-comments-crawler';

const account = {
  username: "100065050175809",
  password: "123@Xuanzhi",
  secretCode: "WMK46GXZP7EWDMARJNMAN2TGGH362XRG"
}

async function testCrawl() {

  const postDetailCrawler = new PostDetailCrawler("https://www.facebook.com/groups/115360783883396/posts/616789723740497/");

  const result = await postDetailCrawler
    .setLimit(10)
    .setAccount(account)
    .start();

  console.log(result);

  await new Promise((resolve) => setTimeout(resolve, 50000));
}

async function testDb() {
  const db = await Database.getInstance();

      await db.savePost({
        content: "test 1",
        link: "https://www.facebook.com/groups/988092548658730/posts/1462652164536097/",
        comments: [],
      });
}

// testTrigger();
// testCrawl();
testDb();
