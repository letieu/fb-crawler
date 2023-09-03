import 'dotenv/config';
import { PostIdsCrawler } from './crawlers/post-ids-crawler';
import { crawlQueue } from './queues/crawl-queue';
import { JobType } from './workers/helper';
import { initPuppeter } from './crawlers/helper';

const account = {
  username: "100048585607851",
  password: "123@Xuanzhi",
  secretCode: "TKSEI5NK6JA7SWUDJSSDCZ4ZIIPKK2YQ"
}

async function testTrigger() {
  await crawlQueue.drain();

  const job = await crawlQueue.add(
    "https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/", // name
    {
      type: JobType.POST_IDS,
      url: "https://www.facebook.com/groups/817474248860972eld/posts/1373830483225343/"
    },
  );

  console.log(`Added job ${job.id} to queue ${crawlQueue.name} \n`);
  // log total job in queue
  const jobCounts = await crawlQueue.getJobCounts();
  console.log(jobCounts);
}


testTrigger();
