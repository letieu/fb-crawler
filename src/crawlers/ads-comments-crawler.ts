import { Browser, Page } from "puppeteer-core";
import { parseComments } from "../parsers/comment-parser";
import { parsePost } from "../parsers/post-parser";
import {
  Account,
  CrawlResult,
  convertToPagePostLinkDesiredFormat,
  convertToGroupPostLinkDesiredFormat,
  delayRandomTime,
  initPuppeter,
  loginFacebook,
} from "./helper";
import "dotenv/config";

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_DETAIL;

export type CommentResult = {
  commentId: string;
  name: string;
  comment: string;
  images: string[];
  time: string;
  uid: string;
};

export type PostDetailResult = {
  link: string;
  content: string;
  userId: string;
  time: string;
  comments: CommentResult[];
};

// crawl post comments and post content
export class AdsDetailCrawler {
  postUrl: string;

  account: Account;
  limit = 20;

  constructor(url: string) {
    this.postUrl = url;
  }

  setLimit(limit: number) {
    this.limit = limit;
    return this;
  }

  setAccount(account: Account) {
    this.account = account;
    return this;
  }

  async start() {
    let browser: Browser;

    console.log(`Start crawling post ${this.postUrl} \n`);

    let res: CrawlResult<PostDetailResult> = {
      success: false,
      loginFailed: false,
      data: {
        link: this.postUrl,
        content: null,
        userId: null,
        comments: [],
        time: "",
      },
    };

    try {
      browser = await initPuppeter(this.account, chromeWsEndpoint);

      const page = await browser.newPage();
      page.setViewport({ width: 1500, height: 764 });

      const loginSuccess = await loginFacebook(page, this.account);
      console.log("loginSuccess", loginSuccess);

      if (loginSuccess) {
        const url = convertToPagePostLinkDesiredFormat(this.postUrl);

        await page.goto(url, { waitUntil: "networkidle2" });

        await delayRandomTime(1000, 1500);

        const post = await this.getPostContent(page);

        //res.data.comments = await this.getComments(page);

        res.data.content = post.content;
        res.data.userId = post.uid;
        res.data.time = post.time;
        res.success = true;
      } else {
        res.loginFailed = true;
      }
    } catch (error) {
      console.log("error when crawling post: ");
      console.error(error);
    } finally {
      if (browser) browser.close();
      await delayRandomTime(3000, 8000);
    }

    console.log(`Finish`, res);

    return res;
  }

  async getComments(page: Page) {
    const allComments: CommentResult[] = [];

    while (true) {
      const comments = await page.evaluate(parseComments);

      allComments.push(...comments);

      if (allComments.length >= this.limit) {
        break;
      }

      const loadMoreSelector = "[id^=see_next_] > a";
      const loadMoreLink = await page.$(loadMoreSelector);

      if (loadMoreLink) {
        await delayRandomTime(1000, 6000);

        // scroll to load more
        await page.evaluate(() => {
          const element = document.querySelector("[id^=see_next_] > a");

          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const link = await page.$eval(loadMoreSelector, (el) => {
          const href = el.getAttribute("href");
          const origin = location.origin;
          return origin + href;
        });

        await page.goto(link, { waitUntil: "networkidle2" });
      } else {
        break;
      }
    }

    return allComments;
  }

  async getPostContent(page: Page) {
    return page.evaluate(parsePost);
  }
}
