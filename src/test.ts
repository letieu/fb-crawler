import 'dotenv/config';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { crawlQueue } from './queues/crawl-queue';
import { JobType } from './workers/helper';

const account = {
  username: "100057832492689",
  password: "123@Xuanzhi",
  secretCode: "GZHLF5OPEZVTCE5JDWV6NL5QMLADKNZF"
}

async function testCrawler() {
  const crawler = new PostIdsCrawler("817474248860972eld", account);
  // const crawler = new PostCommentCrawler("https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/", account);
  crawler.setLimit(30);

  const postIds = await crawler.start();
  console.log(postIds);
}

async function testTrigger() {
  await crawlQueue.drain();

  const job = await crawlQueue.add(
    "https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/", // name
    {
      type: JobType.POST_IDS,
      account,
      url: "https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/"
    },
  );

  console.log(`Added job ${job.id} to queue ${crawlQueue.name} \n`);
  // log total job in queue
  const jobCounts = await crawlQueue.getJobCounts();
  console.log(jobCounts);
}

testCrawler();
