import "dotenv/config";
import { AdsIdsCrawler } from "./crawlers/ads-ids-crawler";
import { PostDetailCrawler } from "./crawlers/post-comments-crawler";
import { AdsDetailCrawler } from "./crawlers/ads-comments-crawler";

const account = {
  username: "100074448351348",
  password: "Ongvang@999xx",
  secretCode: "OF6POXEYFAQYOTHIGWZ3FZG6U6CNF5X3",
};

async function testCrawl() {
  //const crawler = new LikePageCrawler();
  //crawler.setAccount(account);
  //const res = await crawler.start([
  //  "https://www.facebook.com/aibatvietnam",
  //  "https://www.facebook.com/banhangamazon",
  //]);
  //console.log(res)

  const crawler = new AdsDetailCrawler(
    "https://www.facebook.com/61555737450715/posts/122143842560191248"
  );
  crawler.setAccount(account);
  const result = await crawler.start();

  console.log(result);
}

testCrawl();
