import 'dotenv/config';
import { groupPostIdsQueue } from './queues/group-post-ids';
import { postCommentsQueue } from './queues/post-comments';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { PostCommentCrawler } from './crawlers/post-comments-crawler';

export async function test() {
  const account = {
    username: "",
    password: "",
    secretCode: ""
  }

  await groupPostIdsQueue.drain();
  await postCommentsQueue.drain();


  // const crawler = new PostIdsCrawler("817474248860972eld", account);
  const crawler = new PostCommentCrawler("https://www.facebook.com/groups/817474248860972eld/posts/1375452783063113/", account);
  crawler.setLimit(10);

  const postIds = await crawler.start();
  console.log(postIds);
}

test().catch(console.error);
