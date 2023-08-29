import { Page } from 'puppeteer';
import { parseComments } from '../parsers/comment-parser';
import { parsePost } from '../parsers/post-parser';
import { Account, convertToPostLinkDesiredFormat, delayRandomTime, ensureLogin, initPuppeter, loginFacebook } from './helper';

export class PostCommentCrawler {
  url: string;
  account: Account;

  constructor(url: string, account: Account) {
    this.url = url;
    this.account = account;
  }

  async start() {
    console.log(`Start crawling post ${this.url} \n`);
    const { browser, page } = await initPuppeter(this.account);

    try {
      const url = convertToPostLinkDesiredFormat(this.url);
      await page.goto(url, { waitUntil: "networkidle2" });

      const loginSuccess = await ensureLogin(page, this.account); // TODO: mark profileId as invalid if login fail
      const post = await this.getPostContent(page);
      const comments = await this.getComments(page, 20);
      
      return {
        content: post.content,
        userId: post.uid,
        comments
      }
    } catch (error) {
      console.error(error);
    } finally {
      // await browser.close();
    }
  }

  async getComments(page: Page, limit = 1000) {
    const allComments = [];

    while (true) {
      const comments = await page.evaluate(parseComments);

      allComments.push(...comments);

      if (allComments.length >= limit) {
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

        await loadMoreLink.click();
        await page.waitForNavigation({ waitUntil: "networkidle2" });
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
