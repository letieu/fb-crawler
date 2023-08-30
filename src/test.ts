import 'dotenv/config';
import { groupPostIdsQueue } from './queues/group-post-ids';
import { postCommentsQueue } from './queues/post-comments';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';

export async function test() {
  const account = {
    username: "xx",
    password: "xx",
    secretCode: "xx"
  }

  await groupPostIdsQueue.drain();
  await postCommentsQueue.drain();


  const crawler = new PostIdsCrawler("817474248860972eld", account);
  crawler.setLimit(3);

  const postIds = await crawler.start();
  console.log(postIds);
}

test().catch(console.error);
