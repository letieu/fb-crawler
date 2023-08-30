import 'dotenv/config';
import { groupPostIdsQueue } from './queues/group-post-ids';
import { postCommentsQueue } from './queues/post-comments';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { PostCommentCrawler } from './crawlers/post-comments-crawler';
import { initPuppeter, loginFacebook } from './crawlers/helper';
import config from './crawlers/config';

export async function test() {
  await new Promise(resolve => setTimeout(resolve, 5000));

  const account = {
    username: "100082164458134",
    password: "123@Xuanzhi",
    secretCode: "R333PGH6XGFDL34ZFM3Z5YYCZOTEBPZW"
  }

  // await groupPostIdsQueue.drain();
  // await postCommentsQueue.drain();


  // const crawler = new PostIdsCrawler("canthoanuong", account);
  // // const crawler = new PostCommentCrawler("https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/", account);
  // crawler.setLimit(100);
  //
  // const postIds = await crawler.start();
  // console.log(postIds);
  //
  const { page, browser } = await initPuppeter(account);

  await loginFacebook(page, account);
  await page.goto("https://mbasic.facebook.com/groups/canthoanuong/", { waitUntil: "networkidle2" });
}

test().catch(console.error);
