import { Page } from 'puppeteer';
import { parseComments } from '../parsers/comment-parser';
import { parsePost } from '../parsers/post-parser';
import { Account, convertToPostLinkDesiredFormat, delayRandomTime, ensureLogin, initPuppeter, loginFacebook } from './helper';

// crawl post comments and post content
export class PostCommentCrawler {
  url: string;
  account: Account;

  limit = 20;

  constructor(url: string, account: Account) {
    this.url = url;
    this.account = account;
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  async start() {
    console.log(`Start crawling post ${this.url} \n`);
    const { browser, page } = await initPuppeter(this.account);

    let res;

    try {
      await loginFacebook(page, this.account);

      const url = convertToPostLinkDesiredFormat(this.url);
      await page.goto(url, { waitUntil: "networkidle2" });

      console.log('on post page');
      await delayRandomTime(1000, 1500);

      const post = await this.getPostContent(page);
      console.log('post', post);

      const comments = await this.getComments(page);
      console.log('comments', comments);

      res = {
        link: this.url,
        content: post.content,
        userId: post.uid,
        comments
      }
    } catch (error) {
    } finally {
      // await browser.close();
    }

    return res;
  }

  async getComments(page: Page) {
    const allComments = [];

    while (true) {
      const comments = await page.evaluate(parseComments);
      console.log('comments on getCmt', comments);

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
