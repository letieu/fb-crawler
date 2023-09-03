import 'dotenv/config';
import { crawlQueue } from './queues/crawl-queue';
import { JobType } from './workers/helper';
import { PostDetailCrawler } from './crawlers/post-comments-crawler';
import { initPuppeter } from './crawlers/helper';

const account = {
  username: "100062953837045",
  password: "haihau2029",
  secretCode: "DXLXICOMNBHMXXO2UMPKIXTEHFJPJLOC"
}

async function testTrigger() {
  await crawlQueue.drain();

  const job = await crawlQueue.add(
    "asdf",
    {
      type: JobType.POST_DETAIL,
      url: ""
    },
  );

  console.log(`Added job ${job.id} to queue ${crawlQueue.name} \n`);
  // log total job in queue
  const jobCounts = await crawlQueue.getJobCounts();
  console.log(jobCounts);
}

async function testCrawl() {
  const browser = await initPuppeter(
    account,
    process.env.CHROME_WS_ENDPOINT,
  );
  const page = await browser.newPage();
  page.setViewport({ width: 1500, height: 764 });

  const url = "https://www.facebook.com/groups/3010245959248794/posts/3643909915882392/";

  const postDetailCrawler = new PostDetailCrawler(url);
  const result = await postDetailCrawler
    .setLimit(50)
    .setAccount(account)
    .start(page);

  console.log(result);
}

// testTrigger();
testCrawl();
