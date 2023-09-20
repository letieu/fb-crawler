import 'dotenv/config';
import { initPuppeter } from './crawlers/helper';
import Database from './database/database';
import { getDbConfig } from './database/helper';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { PostDetailCrawler } from './crawlers/post-comments-crawler';

const account = {
  username: "100052351592150",
  password: "123@Xuanzhi",
  secretCode: "HQBON4P3Y4YCC6LY63T6HNITVEWZCT32"
}

async function testCrawl() {

  const postDetailCrawler = new PostDetailCrawler("https://www.facebook.com/groups/362261550867819/posts/1756306044796689/");

  const result = await postDetailCrawler
    .setLimit(10)
    .setAccount(account)
    .start();

  console.log(result);

  await new Promise((resolve) => setTimeout(resolve, 50000));
}

async function testDb() {
  const db = await Database.getInstance();

  // await db.savePost({
  //   content: "test 1",
  //   link: "https://www.facebook.com/groups/988092548658730/posts/1462652164536097/",
  //   comments: [],
  // });
  const res = await db.getPosts()

  console.log(res[0]);
  console.log(res.pop())
}

// testTrigger();
testCrawl();
// testDb();
