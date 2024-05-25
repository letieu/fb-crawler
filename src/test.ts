import "dotenv/config";
import { LikePageCrawler } from "./crawlers/like-page-crawler";

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

  const crawler = new LikePageCrawler();
  crawler.setAccount(account);
  const result = await crawler.start([
    "https://www.facebook.com/profile.php?id=61553776500279",
    "https://www.facebook.com/giadungtienich050968",
  ]);

  console.log(result);
}

testCrawl();
