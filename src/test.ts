import { PostCommentCrawler } from "./crawlers/post-comments-crawler";
import { authenticator } from 'otplib';
import 'dotenv/config';
import { get2fa } from "./crawlers/helper";
import { PostIdsCrawler } from "./crawlers/post-ids-crawler";

async function test() {
  // const crawler = new PostCommentCrawler(
  //   "https://www.facebook.com/BaTamShowbiz.vn/posts/632739385624894",
  //   {
  //     username: "100082164458134",
  //     password: "123@Xuanzhi",
  //     secretCode: "R333PGH6XGFDL34ZFM3Z5YYCZOTEBPZW"
  //   }
  // );

  const crawler = new PostIdsCrawler(
    "mebimsuachiasemeonuoicon",
    {
      username: "100082164458134",
      password: "123@Xuanzhi",
      secretCode: "R333PGH6XGFDL34ZFM3Z5YYCZOTEBPZW"
    }
  );

  const result = await crawler.start();
  console.log(result);
}

test().catch(console.error);

// console.log(get2fa("R333PGH6XGFDL34ZFM3Z5YYCZOTEBPZW"));
