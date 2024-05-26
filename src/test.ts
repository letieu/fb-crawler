import "dotenv/config";
import { LikePageCrawler } from "./crawlers/like-page-crawler";

const account = {
  username: "61554888271122",
  password: "Ongvang@999",
  secretCode: "A6BDYTL3CRO6QXJIRC7IP4BYVJPZ77P3",
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
    "https://www.facebook.com/aibatvietnam",
    "https://www.facebook.com/banhangamazon",
  ]);

  console.log(result);
}

testCrawl();
