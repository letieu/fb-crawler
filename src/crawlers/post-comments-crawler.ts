import { Browser, Page } from 'puppeteer-core';
import { parseComments } from '../parsers/comment-parser';
import { parsePost } from '../parsers/post-parser';
import { Account, CrawlResult, convertToPostLinkDesiredFormat, delayRandomTime, ensureLogin, initPuppeter, loginFacebook } from './helper';
import 'dotenv/config';

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_DETAIL;

export type CommentResult = {
  commentId: string;
  name: string;
  comment: string;
  images: string[];
  time: string;
  uid: string;
}

export type PostDetailResult = {
  link: string;
  content: string;
  userId: string;
  comments: CommentResult[];
}

// crawl post comments and post content
export class PostDetailCrawler {
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

    let res: CrawlResult<PostDetailResult>;
    let loginFailed = false;

    try {
      browser = await initPuppeter(
        this.account,
        chromeWsEndpoint,
      )

      const page = await browser.newPage();
      page.setViewport({ width: 1500, height: 764 });

      await loginFacebook(page, this.account).catch(() => {
        loginFailed = true;
      });

      const url = convertToPostLinkDesiredFormat(this.postUrl);
      await page.goto(url, { waitUntil: "networkidle2" });

      await delayRandomTime(1000, 1500);

      const post = await this.getPostContent(page);

      const comments = await this.getComments(page);

      res = {
        success: true,
        loginFailed,
        data: {
          link: this.postUrl,
          content: post.content,
          userId: post.uid,
          comments
        }
      }

      if (page) await page.close();
    } catch (error) {
      console.log('error when crawling post: ');
      console.error(error);

      res = {
        success: false,
        loginFailed,
        data: null,
      };
    } finally {
      if (browser) await browser.close();

      await delayRandomTime(1000, 3000);
    }

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
        const link = await page.$eval(loadMoreSelector, (el) => el.getAttribute("href"));

        await page.goto(link, { waitUntil: "networkidle2" });
      }
      else {
        break;
      }
    }

    return allComments;
  }

  async getPostContent(page: Page) {
    return page.evaluate(parsePost)
  }
}
