import { PostCrawler } from "./crawler";

async function test() {
  const crawler = new PostCrawler(
    "https://www.facebook.com/BaTamShowbiz.vn/posts/632739385624894",
    {
      headless: false,
    }
  );

  console.log(crawler);
  const result = await crawler.start();
  console.log(result);
}

test().catch(console.error);
