import "dotenv/config";
import { LikePageCrawler } from "./crawlers/like-page-crawler";

const account = {
  username: "61554726489320",
  password: "Ongvang@999",
  secretCode: "QRGGX6JFOA2IOJVYIQA4T6SC3WI5IT4X",
};

async function testCrawl() {
  const liker = new LikePageCrawler();
  liker.setAccount(account);
  const result = await liker.start([
    "https://www.facebook.com/aibatvietnam",
    "https://www.facebook.com/banhangamazon"
  ]);

  console.log(result);
}

testCrawl();

//console.log(get2fa(account.secretCode))
